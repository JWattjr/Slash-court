import json

from tests.direct.conftest import RULEBOOK_HASH, RULEBOOK_TEXT


def test_case_policy_primitives_reject_unknown_rule_ids(court_contract, direct_vm, direct_owner):
    court = court_contract
    direct_vm.sender = direct_owner
    court.create_initial_rulebook(RULEBOOK_TEXT, RULEBOOK_HASH)
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R999"], "alleged rule ids")
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R3", "R3"], "alleged rule ids")
    assert court._validate_rule_ids(json.loads('["R3", "R4"]'), "alleged rule ids") == ["R3", "R4"]


def test_response_window_timestamp_arithmetic_is_canonical(court_contract):
    court = court_contract
    assert court._add_seconds("2025-01-01T23:59:59Z", 86_400) == "2025-01-02T23:59:59Z"
    assert court._add_seconds("2024-02-28T23:59:59Z", 86_400) == "2024-02-29T23:59:59Z"
