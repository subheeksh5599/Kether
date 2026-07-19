"""
Linear regression revenue predictor.

Inputs: agent payment history (time-series)
Output: predicted revenue for next 30 days with confidence interval
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from engine.store import get_db


def predict_revenue(agent_id: int, endpoint: str) -> tuple[int, float]:
    """Predict 30-day revenue for an agent's endpoint. Returns (predicted_amount, confidence_0_to_1)."""
    db = get_db()

    # Get per-service payment history
    rows = db.execute(
        "SELECT timestamp, CAST(amount AS INTEGER) as amt FROM payments WHERE agent_id = ? AND service_id = ? ORDER BY timestamp",
        (agent_id, endpoint),
    ).fetchall()

    if len(rows) < 3:
        return 0, 0.0  # Not enough data

    # Aggregate by day
    daily: dict[int, int] = {}
    for r in rows:
        day = r["timestamp"] // 86400
        daily[day] = daily.get(day, 0) + r["amt"]

    days = sorted(daily.keys())
    X = np.array(range(len(days))).reshape(-1, 1)
    y = np.array([daily[d] for d in days])

    # Fit linear regression
    model = LinearRegression()
    model.fit(X, y)

    # Predict next 30 days
    future_X = np.array(range(len(days), len(days) + 30)).reshape(-1, 1)
    predictions = model.predict(future_X)
    total_predicted = max(0, int(sum(predictions)))

    # Confidence: R² score (0-1), clamped
    r2 = model.score(X, y)
    confidence = max(0.0, min(1.0, float(r2)))

    return total_predicted, confidence
