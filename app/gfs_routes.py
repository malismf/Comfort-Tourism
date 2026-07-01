import os
import sys
import traceback

from flask import Blueprint, render_template, jsonify, request

# database_connection.py лежит в корне проекта, на уровень выше app/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database_connection import get_connection

gfs_bp = Blueprint("gfs", __name__)


@gfs_bp.route("/api/gfs/days")
def api_gfs_days():
    """
    Возвращает список доступных forecast_day с датами для последнего прогона.
    [{"day": 0, "date": "2026-06-26"}, {"day": 1, "date": "2026-06-27"}, ...]
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT DISTINCT t.forecast_day,
                           MIN(t.date_local)::text AS date_local
                    FROM   tci_mo_daily t
                    WHERE  t.run_id = (SELECT MAX(run_id) FROM tci_mo_daily)
                    GROUP  BY t.forecast_day
                    ORDER  BY t.forecast_day
                """)
                rows = cur.fetchall()
        return jsonify([{"day": r[0], "date": r[1]} for r in rows])
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@gfs_bp.route("/api/gfs/tci")
def api_gfs_tci():
    """
    Возвращает TCI по всем МО для последнего прогона и заданного дня.
    ?forecast_day=0

    Ответ:
    {
      "run_id": 8,
      "run_date": "2026-06-26",
      "cycle": 0,
      "forecast_day": 0,
      "data": [{"mo_id": 1, "name": "Аларский", "tci": 94.0, "date_local": "2026-06-26"}, ...]
    }
    """
    forecast_day = request.args.get("forecast_day", 0, type=int)
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Один запрос: последний run_id + join с mo_boundary + join с forecast_run
                cur.execute("""
                    SELECT  t.mo_id,
                            m.name,
                            t.tci,
                            t.date_local::text,
                            t.run_id,
                            fr.run_date::text,
                            fr.cycle
                    FROM    tci_mo_daily   t
                    JOIN    mo_boundary    m  ON t.mo_id   = m.id
                    JOIN    forecast_run   fr ON t.run_id  = fr.id
                    WHERE   t.run_id = (SELECT MAX(run_id) FROM tci_mo_daily)
                      AND   t.forecast_day = %s
                    ORDER   BY t.mo_id
                """, (forecast_day,))
                rows = cur.fetchall()

        if not rows:
            return jsonify({
                "run_id": None, "run_date": None, "cycle": None,
                "forecast_day": forecast_day, "data": []
            })

        # Первый ряд содержит метаданные прогона (одинаковы для всех строк)
        run_id    = rows[0][4]
        run_date  = rows[0][5]
        cycle     = rows[0][6]

        data = [
            {
                "mo_id":      r[0],
                "name":       r[1],
                "tci":        round(float(r[2]), 1) if r[2] is not None else None,
                "date_local": r[3],
            }
            for r in rows
        ]

        return jsonify({
            "run_id":       run_id,
            "run_date":     run_date,
            "cycle":        cycle,
            "forecast_day": forecast_day,
            "data":         data,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "data": []}), 500


@gfs_bp.route("/api/gfs/hci")
def api_gfs_hci():
    """
    Возвращает HCI по всем МО для последнего прогона и заданного дня.
    ?forecast_day=0

    Ответ:
    {
      "run_id": 8,
      "run_date": "2026-06-26",
      "cycle": 0,
      "forecast_day": 0,
      "data": [{"mo_id": 1, "name": "Аларский", "hci": 94.0, "date_local": "2026-06-26"}, ...]
    }
    """
    forecast_day = request.args.get("forecast_day", 0, type=int)
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Один запрос: последний run_id + join с mo_boundary + join с forecast_run
                cur.execute("""
                    SELECT  h.mo_id,
                            m.name,
                            h.hci,
                            h.date_local::text,
                            h.run_id,
                            fr.run_date::text,
                            fr.cycle
                    FROM    hci_mo_daily    h
                    JOIN    mo_boundary     m  ON h.mo_id   = m.id
                    JOIN    forecast_run    fr ON h.run_id  = fr.id
                    WHERE   h.run_id = (SELECT MAX(run_id) FROM hci_mo_daily)
                      AND   h.forecast_day = %s
                    ORDER   BY h.mo_id
                """, (forecast_day,))
                rows = cur.fetchall()

        if not rows:
            return jsonify({
                "run_id": None, "run_date": None, "cycle": None,
                "forecast_day": forecast_day, "data": []
            })

        # Первый ряд содержит метаданные прогона (одинаковы для всех строк)
        run_id    = rows[0][4]
        run_date  = rows[0][5]
        cycle     = rows[0][6]

        data = [
            {
                "mo_id":      r[0],
                "name":       r[1],
                "hci":        round(float(r[2]), 1) if r[2] is not None else None,
                "date_local": r[3],
            }
            for r in rows
        ]

        return jsonify({
            "run_id":       run_id,
            "run_date":     run_date,
            "cycle":        cycle,
            "forecast_day": forecast_day,
            "data":         data,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "data": []}), 500


@gfs_bp.route("/api/gfs/series")
def api_gfs_series():
    """
    Возвращает TCI и HCI (со всеми субиндексами) для ОДНОГО МО
    за все дни прогноза (последний прогон). Для линейного графика.

    Параметр:
        ?mo=<название МО>      (например: ?mo=Аларский)

    Ответ:
    {
      "run_id": 8,
      "run_date": "2026-06-26",
      "cycle": 0,
      "mo_id": 1,
      "name": "Аларский",
      "days": [{"day": 0, "date": "2026-06-26"}, {"day": 1, "date": "2026-06-27"}, ...],
      "series": [
        {
          "forecast_day": 0,
          "date_local": "2026-06-26",
          "tci": 94.0,
          "hci": 88.0,
          "tci_parts": {"cid": 90.0, "cia": 85.0, "r": 100.0, "s": 80.0, "w": 60.0},
          "hci_parts": {"et": 9.0,  "tc": 10.0, "a": 5.0,  "r": 6.0,  "w": 1.0}
        },
        ...
      ]
    }
    """
    mo = request.args.get("mo", type=str)

    empty = {
        "run_id": None, "run_date": None, "cycle": None,
        "mo_id": None, "name": mo, "days": [], "series": []
    }
    if not mo:
        return jsonify(empty)

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Якорь — последний run_id из tci_mo_daily (как и в /api/gfs/days).
                # HCI подтягивается LEFT JOIN по (run_id, mo_id, forecast_day),
                # чтобы строка сохранялась даже при отсутствии HCI на день.
                # Субиндексы r и w есть в обеих таблицах — разводим по алиасам.
                cur.execute("""
                    SELECT  t.mo_id,
                            m.name,
                            t.forecast_day,
                            t.date_local::text,
                            t.tci,
                            t.cid,
                            t.cia,
                            t.r   AS tci_r,
                            t.s   AS tci_s,
                            t.w   AS tci_w,
                            h.hci,
                            h.et,
                            h.tc,
                            h.a,
                            h.r   AS hci_r,
                            h.w   AS hci_w,
                            t.run_id,
                            fr.run_date::text,
                            fr.cycle
                    FROM    tci_mo_daily   t
                    JOIN    mo_boundary    m  ON t.mo_id = m.id
                    JOIN    forecast_run   fr ON t.run_id = fr.id
                    LEFT JOIN hci_mo_daily h  ON h.run_id       = t.run_id
                                             AND h.mo_id        = t.mo_id
                                             AND h.forecast_day = t.forecast_day
                    WHERE   t.run_id = (SELECT MAX(run_id) FROM tci_mo_daily)
                      AND   m.name = %s
                    ORDER   BY t.forecast_day
                """, (mo,))
                rows = cur.fetchall()

        if not rows:
            return jsonify(empty)

        def rnd(x):
            return round(float(x), 1) if x is not None else None

        # Метаданные прогона + идентификация МО (одинаковы для всех строк)
        mo_id    = rows[0][0]
        name     = rows[0][1]
        run_id   = rows[0][16]
        run_date = rows[0][17]
        cycle    = rows[0][18]

        # Временной ряд по дням
        series = []
        for r in rows:
            (_, _, fday, date_local, tci, cid, cia, tci_r, tci_s, tci_w,
             hci, et, tc, a, hci_r, hci_w, _, _, _) = r

            series.append({
                "forecast_day": fday,
                "date_local":   date_local,
                "tci":          rnd(tci),
                "hci":          rnd(hci),
                "tci_parts": {
                    "cid": rnd(cid),
                    "cia": rnd(cia),
                    "r":   rnd(tci_r),
                    "s":   rnd(tci_s),
                    "w":   rnd(tci_w),
                },
                "hci_parts": {
                    "et": rnd(et),
                    "tc": rnd(tc),
                    "a":  rnd(a),
                    "r":  rnd(hci_r),
                    "w":  rnd(hci_w),
                },
            })

        days = [{"day": s["forecast_day"], "date": s["date_local"]} for s in series]

        return jsonify({
            "run_id":   run_id,
            "run_date": run_date,
            "cycle":    cycle,
            "mo_id":    mo_id,
            "name":     name,
            "days":     days,
            "series":   series,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "series": []}), 500