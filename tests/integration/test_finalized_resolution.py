import pytest

from .conftest import build_protocol, finalized, fund_commitment, run_case


@pytest.mark.integration
def test_resolution_application_and_callback_are_finalized_and_replay_safe():
    protocol = build_protocol()
    result = run_case(protocol, "PROVABLE_MISCONDUCT", exposure=20)
    duty = result["case"]["canonical_commitment"]
    assert result["pre_retry_case"]["adjudication_finalized"] is True
    assert result["pre_retry_case"]["network_status"] == "FINALIZED_MESSAGE_PENDING"
    assert result["pre_retry_application"]["applied"] is False
    assert result["pre_retry_operator"]["total_bond"] == 100
    assert result["pre_retry_operator"]["locked_exposure"] == 20
    assert result["case"]["network_status"] == "FINALIZED"
    assert result["case"]["application_status"] == "APPLIED_FINALIZED"
    assert result["case"]["adjudication_finalized"] is True
    assert duty["service_description"] == "A bounded automation keeper duty"
    assert duty["duty_trigger"] == "scheduled-trigger-integration"
    assert duty["duty_deadline"] == "2099-01-01T00:00:00Z"
    assert duty["dispute_deadline"] == "2099-01-02T00:00:00Z"
    assert duty["expected_action_id"] == "maintenance-action-integration"
    assert result["application"]["applied"] is True
    assert result["application"]["commitment_digest"] == duty["commitment_digest"]
    assert result["application"]["alleged_rule_ids"] == ["R5"]
    assert result["application"]["evidence_citations"] == [
        {
            "evidence_id": "E1",
            "evidence_type": "PUBLIC_STATUS",
            "submission_party": "CLAIMANT",
            "source_domain": "status.example.org",
            "content_hash": "sha256:1831a9ed89110e78457036e481161472d0d6fdf9367c11f8e8552722deed0f6c",
            "relevant_rule_ids": ["R3", "R4", "R5"],
        }
    ]

    # The application record is keyed by case id. A retry after the callback
    # is finalized returns without changing balances or creating a second
    # award.
    finalized(protocol["court"].retry_resolution_application(args=["case-1"]))
    assert protocol["vault"].get_case_application(args=["case-1"]).call()["penalty_amount"] == 20
    assert protocol["vault"].get_operator(args=[protocol["operator"].address]).call()["total_bond"] == 80


@pytest.mark.integration
def test_silent_operator_can_be_marked_ready_after_bounded_timeout():
    protocol = build_protocol()
    fund_commitment(protocol, "commitment-timeout", exposure=20)
    court = protocol["court"].connect(protocol["beneficiary"])
    finalized(
        court.open_case(args=["commitment-timeout", "The keeper missed the duty.", "[]"]),
        triggered=True,
        context={"genvm_datetime": "2099-01-01T23:59:59Z"},
    )
    case = protocol["court"].get_case(args=["case-1"]).call()
    assert case["operator_response"] == ""
    assert case["response_deadline"] == "2099-01-02T23:59:59Z"

    finalized(
        court.mark_case_ready(args=["case-1", '["R1"]']),
        context={"genvm_datetime": "2099-01-03T00:00:00Z"},
    )
    assert protocol["court"].get_case(args=["case-1"]).call()["status"] == "READY_FOR_ADJUDICATION"


@pytest.mark.integration
def test_case_cancellation_unbinds_commitment_without_releasing_exposure():
    protocol = build_protocol()
    fund_commitment(protocol, "commitment-cancel", exposure=20)
    court = protocol["court"].connect(protocol["beneficiary"])
    finalized(
        court.open_case(args=["commitment-cancel", "The keeper missed the duty.", "[]"]),
        triggered=True,
    )
    finalized(court.cancel_case(args=["case-1"]), triggered=True)
    # The first read advances GLSim's queued finality callback; the second
    # observes the resulting court state.
    protocol["court"].get_case(args=["case-1"]).call()
    case = protocol["court"].get_case(args=["case-1"]).call()
    commitment = protocol["vault"].get_commitment(args=["commitment-cancel"]).call()
    assert case["status"] == "CANCELLED"
    assert case["network_status"] == "CANCELLED"
    assert commitment["status"] == "ACTIVE"
    assert commitment["case_id"] == ""
    assert protocol["vault"].get_balance_breakdown(args=[protocol["operator"].address]).call()["locked_exposure"] == 20
