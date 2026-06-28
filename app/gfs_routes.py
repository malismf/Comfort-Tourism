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