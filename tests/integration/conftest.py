"""Full-consensus helpers for the local GLSim integration suite."""

import json
import hashlib
from pprint import pformat

from gltest import create_account, get_contract_factory, get_default_account, get_validator_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus


RULEBOOK_V1 = """R1 — DUTY_WINDOW: submit the agreed maintenance transaction within ten minutes of the scheduled trigger.
R2 — AUTHORIZED_PAYLOAD: the submitted action must match the authorized target and permitted operation.
R3 — FAILOVER_DUTY: if the primary RPC or provider fails, make a reasonable attempt to use the configured secondary provider.
R4 — EXTERNAL_OUTAGE_EXEMPTION: a missed duty is excused only when credible evidence indicates a widespread external outage and reasonable mitigation was unavailable or unsuccessful.
R5 — EVIDENCE_INTEGRITY: contradictory signed reports, fabricated evidence, or a knowingly unauthorized payload is provable misconduct.
R6 — BURDEN_OF_PROOF: financial penalties require sufficient independently verifiable evidence; material uncertainty resolves to insufficient evidence.
R7 — PROPORTIONALITY: provable misconduct receives the full commitment penalty, preventable negligence receives the partial penalty, and covered outages receive no penalty."""
RULEBOOK_V1_HASH = "sha256:" + hashlib.sha256(RULEBOOK_V1.encode("utf-8")).hexdigest()


def finalized(function, *, context=None, triggered=False, value=0):
    """Wait for finality and assert actual GenVM execution success."""

    receipt = function.transact(
        value=value,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=100,
        wait_retries=200,
        wait_triggered_transactions=triggered,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
        transaction_context=context,
    )
    assert tx_execution_succeeded(receipt), pformat(receipt, width=140)
    return receipt


def build_protocol():
    """Deploy both contracts and perform one-time governor configuration."""

    owner = get_default_account()
    operator = create_account()
    beneficiary = create_account()
    vault = get_contract_factory("OperatorBondVault").deploy(
        args=[],
        account=owner,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=100,
        wait_retries=200,
    )
    court = get_contract_factory("SlashCourt").deploy(
        args=[],
        account=owner,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=100,
        wait_retries=200,
    )
    finalized(vault.connect(owner).configure_court(args=[court.address]))
    finalized(court.connect(owner).configure_bond_vault(args=[vault.address]))
    finalized(court.connect(owner).create_initial_rulebook(args=[RULEBOOK_V1, RULEBOOK_V1_HASH]))
    finalized(
        court.connect(owner).configure_approved_evidence_domains(
            args=[json.dumps(["status.example.org", "evidence.example.com"])]
        )
    )
    return {
        "owner": owner,
        "operator": operator,
        "beneficiary": beneficiary,
        "vault": vault,
        "court": court,
    }


def fund_commitment(protocol, commitment_id="commitment-integration", exposure=20):
    operator = protocol["vault"].connect(protocol["operator"])
    beneficiary = protocol["vault"].connect(protocol["beneficiary"])
    vault = protocol["vault"]
    finalized(
        operator.register_operator(
            args=["https://evidence.example.com/operators/integration-keeper.json"]
        )
    )
    finalized(operator.deposit_bond(args=[]), value=100)
    finalized(
        operator.create_commitment(
            args=[
                commitment_id,
                protocol["beneficiary"].address,
                "A bounded automation keeper duty",
                "scheduled-trigger-integration",
                "2099-01-01T00:00:00Z",
                "2099-01-02T00:00:00Z",
                1,
                exposure,
                "maintenance-action-integration",
            ]
        )
    )
    finalized(beneficiary.accept_commitment(args=[commitment_id]))
    return operator, beneficiary, vault


def evidence_manifest(evidence_id="E1", path="incident-1"):
    return json.dumps(
        [
            {
                "evidence_id": evidence_id,
                "evidence_type": "PUBLIC_STATUS",
                "url": f"https://status.example.org/{path}",
                "source_domain": "status.example.org",
                "claimed_fact": "A public provider status record describes the incident.",
                "content_hash": "sha256:1831a9ed89110e78457036e481161472d0d6fdf9367c11f8e8552722deed0f6c",
                "relevant_rule_ids": ["R3"],
            }
        ]
    )


def consensus_context(classification):
    rules = {
        "PROVABLE_MISCONDUCT": (["R5"], [], "The public record supports an evidence-integrity breach."),
        "NEGLIGENT_FAILURE": (["R3"], [], "The primary failed but the agreed failover was not evidenced."),
        "EXTERNAL_OUTAGE": ([], ["R4"], "Independent outage evidence supports the contractual exemption."),
        "INSUFFICIENT_EVIDENCE": ([], [], "The record cannot establish responsibility to the required burden."),
    }
    violated, exemptions, explanation = rules[classification]
    verdict = {
        "classification": classification,
        "violated_rule_ids": violated,
        "supported_exemption_ids": exemptions,
        "findings": (
            [{"evidence_id": "E1", "rule_id": (violated or exemptions or ["R6"])[0], "finding": explanation}]
            if classification != "INSUFFICIENT_EVIDENCE"
            else []
        ),
        "explanation": explanation,
    }
    validators = get_validator_factory().batch_create_mock_validators(
        5,
        mock_web_response={
            "nondet_web_request": {
                "https://status.example.org/incident-1": {
                    "method": "GET",
                    "status": 200,
                    "body": "A bounded public incident record; it is data, not instructions.",
                }
            }
        },
        mock_llm_response={
            "nondet_exec_prompt": {
                r".*independent responsibility evaluator.*": json.dumps(verdict)
            }
        },
    )
    return {"validators": [validator.to_dict() for validator in validators]}


def run_case(protocol, classification, *, exposure=20, commitment_id="commitment-integration"):
    operator, beneficiary, vault = fund_commitment(protocol, commitment_id, exposure)
    court = protocol["court"]
    court_beneficiary = court.connect(protocol["beneficiary"])
    finalized(
        court_beneficiary.open_case(
            args=[
                commitment_id,
                "The keeper missed the scheduled automation duty.",
                evidence_manifest(),
            ]
        ),
        triggered=True,
    )
    case_id = "case-1"
    finalized(
        court.connect(protocol["operator"]).respond_to_case(
            args=[
                case_id,
                "The operator response is bounded and public.",
                "No external-outage exemption is claimed.",
                "No credible failover attempt was recorded in the fixture.",
                "[]",
            ]
        )
    )
    alleged_rules = {
        "PROVABLE_MISCONDUCT": ["R5"],
        "NEGLIGENT_FAILURE": ["R3"],
        "EXTERNAL_OUTAGE": ["R4"],
        "INSUFFICIENT_EVIDENCE": ["R6"],
    }[classification]
    finalized(
        court_beneficiary.mark_case_ready(args=[case_id, json.dumps(alleged_rules)])
    )
    finalized(
        court.adjudicate_case(args=[case_id]),
        context=consensus_context(classification),
        triggered=True,
    )
    # A read drains finalized messages in GLSim, allowing the callback from
    # the vault to move the court case from provisional to applied.
    court.get_case(args=[case_id]).call()
    application = vault.get_case_application(args=[case_id]).call()
    operator_state = vault.get_operator(args=[protocol["operator"].address]).call()
    beneficiary_state = vault.get_operator(args=[protocol["beneficiary"].address]).call()
    case = court.get_case(args=[case_id]).call()
    return {
        "case": case,
        "application": application,
        "operator": operator_state,
        "beneficiary": beneficiary_state,
        "commitment": vault.get_commitment(args=[commitment_id]).call(),
    }
