import math
from typing import List

from hypothesis import given, strategies as st

from telemetry_lab.backend.detect_leaks import detect_leaks
from telemetry_lab.backend.label_quality import clean_rows, label_quality


@given(
    st.lists(
        st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.just(float("nan"))),
        min_size=1,
        max_size=50,
    )
)
def test_no_nans_after_cleaning(flow_values: List[float]) -> None:
    rows = [
        {
            "timestamp": "2024-01-01T00:00:00",
            "flow": "nan" if math.isnan(val) else f"{val}",
            "pressure": "nan" if math.isnan(val) else "50",
            "temperature": "20",
        }
        for val in flow_values
    ]
    cleaned = clean_rows(rows)
    assert all(row["flow"] != "nan" for row in cleaned)
    assert all(row["pressure"] != "nan" for row in cleaned)


@given(
    st.lists(
        st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.just(float("nan"))),
        min_size=10,
        max_size=80,
    )
)
def test_missing_and_flatline_do_not_overlap(flow_values: List[float]) -> None:
    rows = [
        {
            "timestamp": "2024-01-01T00:00:00",
            "flow": "nan" if math.isnan(val) else f"{val}",
            "pressure": "50",
            "temperature": "20",
        }
        for val in flow_values
    ]
    labels = label_quality(rows)
    missing = [label for label in labels if label.kind == "missing"]
    flatline = [label for label in labels if label.kind == "flatline"]
    if missing and flatline:
        m = missing[0]
        f = flatline[0]
        assert f.end_index < m.start_index or m.end_index < f.start_index


@given(
    st.lists(
        st.floats(min_value=0, max_value=200, allow_nan=False, allow_infinity=False),
        min_size=2,
        max_size=80,
    )
)
def test_detector_alert_indices_within_bounds(flow_values: List[float]) -> None:
    alerts = detect_leaks(flow_values, persistence=3)
    for alert in alerts:
        assert 0 <= alert.start_index <= alert.end_index < len(flow_values)
