from tests.direct.conftest import as_address
from tests.direct.test_bond_accounting import _fund_operator


def test_duplicate_commitment_and_invalid_state_transitions_are_rejected(
    vault_contract, direct_vm, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    args = (
        "commitment-lifecycle",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        20,
        "maintenance-action",
    )
    vault.create_commitment(*args)
    with direct_vm.expect_revert("commitment id already exists"):
        vault.create_commitment(*args)
    with direct_vm.expect_revert("invalid duty-report state"):
        vault.record_duty_result("commitment-lifecycle", "did-not-run")

    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-lifecycle")
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("duty-report authorization required"):
        vault.record_duty_result("commitment-lifecycle", "did-not-run")


def test_disputed_commitment_keeps_exposure_locked(
    vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    direct_vm.sender = direct_owner
    vault.configure_court(as_address(direct_charlie))
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    vault.create_commitment(
        "commitment-disputed",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2099-01-01T00:00:00Z",
        "2099-01-02T00:00:00Z",
        1,
        40,
        "maintenance-action",
    )
    direct_vm.sender = direct_bob
    vault.accept_commitment("commitment-disputed")
    direct_vm.sender = direct_charlie
    vault.bind_case("case-disputed", "commitment-disputed", "2025-01-01T00:00:00Z")
    commitment = vault.get_commitment("commitment-disputed")
    balance = vault.get_balance_breakdown(as_address(direct_alice))
    assert commitment["status"] == "DISPUTED"
    assert balance["locked_exposure"] == 40
    assert balance["available_bond"] == 60


def test_deadlines_are_strict_full_resolution_and_cancellation_is_idempotent(
    vault_contract, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie
):
    vault = vault_contract
    _fund_operator(vault, direct_vm, direct_alice)
    direct_vm.sender = direct_owner
    vault.configure_court(as_address(direct_charlie))
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("UTC ISO-8601"):
        vault.create_commitment(
            "commitment-window",
            as_address(direct_bob),
            "Keeper maintenance",
            "scheduled-trigger",
            "window",
            "2025-01-01T00:00:20Z",
            1,
            10,
            "maintenance-action-window",
        )
    with direct_vm.expect_revert("UTC ISO-8601"):
        vault.create_commitment(
            "commitment-impossible-date",
            as_address(direct_bob),
            "Keeper maintenance",
            "scheduled-trigger",
            "2025-02-30T00:00:10Z",
            "2025-03-01T00:00:20Z",
            1,
            10,
            "maintenance-action-date",
        )
    with direct_vm.expect_revert("dispute deadline precedes duty deadline"):
        vault.create_commitment(
            "commitment-ordering",
            as_address(direct_bob),
            "Keeper maintenance",
            "scheduled-trigger",
            "2025-01-01T00:00:11Z",
            "2025-01-01T00:00:10Z",
            1,
            10,
            "maintenance-action-ordering",
        )

    vault.create_commitment(
        "commitment-boundary",
        as_address(direct_bob),
        "Keeper maintenance",
        "scheduled-trigger",
        "2025-01-01T00:00:10Z",
        "2025-01-01T00:00:20Z",
        1,
        10,
        "maintenance-action-boundary",
    )
    direct_vm.sender = direct_bob
    direct_vm.warp("2025-01-01T00:00:10Z")
    vault.accept_commitment("commitment-boundary")

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("case was opened after"):
        vault.bind_case("case-too-late", "commitment-boundary", "2025-01-01T00:00:21Z")
    vault.bind_case("case-at-deadline", "commitment-boundary", "2025-01-01T00:00:20Z")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("SlashCourt authorization required"):
        vault.cancel_case_binding("case-at-deadline", "commitment-boundary")
    direct_vm.sender = direct_charlie
    vault.cancel_case_binding("case-at-deadline", "commitment-boundary")
    balance_after_cancel = vault.get_balance_breakdown(as_address(direct_alice))
    vault.cancel_case_binding("case-at-deadline", "commitment-boundary")
    assert vault.get_commitment("commitment-boundary")["status"] == "ACTIVE"
    assert vault.get_commitment("commitment-boundary")["case_id"] == ""
    assert vault.get_balance_breakdown(as_address(direct_alice)) == balance_after_cancel

    direct_vm.warp("2025-01-01T00:00:20Z")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("dispute window is still open"):
        vault.release_undisputed_commitment("commitment-boundary")
    direct_vm.warp("2025-01-01T00:00:21Z")
    vault.release_undisputed_commitment("commitment-boundary")
    assert vault.get_balance_breakdown(as_address(direct_alice))["locked_exposure"] == 0
