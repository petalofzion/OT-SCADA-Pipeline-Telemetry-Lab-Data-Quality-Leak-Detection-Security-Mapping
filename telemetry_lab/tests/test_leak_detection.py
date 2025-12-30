from telemetry_lab.backend.detect_leaks import detect_leaks


def test_leak_detector_triggers_on_known_leak() -> None:
    flow_values = [100.0] * 20 + [96.0] * 10 + [100.0] * 5
    alerts = detect_leaks(flow_values, persistence=6)

    assert alerts, "Expected at least one alert for sustained leak pattern"
    alert = alerts[0]
    assert alert.start_index >= 20
    assert alert.end_index >= alert.start_index


def test_leak_detector_not_triggered_on_noise() -> None:
    flow_values = [100.0 + (i % 5) * 0.1 for i in range(60)]
    alerts = detect_leaks(flow_values, persistence=6)
    assert alerts == []
