# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Application-layer bond accounting for SlashCourt.

This vault is deliberately separate from GenLayer's protocol validator
staking/slashing system. It accepts native GEN deposits from external service
operators and only the configured SlashCourt contract can consume a
commitment's pre-locked exposure after a finalized adjudication message.

All money is integer native-token units. Penalties are basis points and are
derived from the closed classification enum below; the court and its model
cannot choose an amount.
"""

from dataclasses import dataclass

from genlayer import *


ERROR_EXPECTED = "[EXPECTED]"
MAX_METADATA_URI_LENGTH = 2_048
MAX_COMMITMENT_ID_LENGTH = 72
MAX_DESCRIPTION_LENGTH = 360
MAX_TRIGGER_LENGTH = 240
MAX_ACTION_LENGTH = 160
MAX_DUTY_RESULT_LENGTH = 280
MAX_CASE_ID_LENGTH = 72

FULL_SLASH_BPS = 10_000
PARTIAL_SLASH_BPS = 5_000
NO_SLASH_BPS = 0
BENEFICIARY_SHARE_BPS = 8_000
SAFETY_POOL_SHARE_BPS = 2_000

CLASSIFICATIONS = (
    "PROVABLE_MISCONDUCT",
    "NEGLIGENT_FAILURE",
    "EXTERNAL_OUTAGE",
    "INSUFFICIENT_EVIDENCE",
)

STATUS_OFFERED = "OFFERED"
STATUS_ACTIVE = "ACTIVE"
STATUS_DUTY_REPORTED = "DUTY_REPORTED"
STATUS_DISPUTED = "DISPUTED"
STATUS_RESOLVED = "RESOLVED"
STATUS_RELEASED = "RELEASED"
STATUS_CANCELLED = "CANCELLED"

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


@allow_storage
@dataclass
class OperatorAccount:
    metadata_uri: str
    total_bond: u256
    available_bond: u256
    locked_exposure: u256
    claimable_awards: u256
    active_commitments: u256
    resolved_commitments: u256


@allow_storage
@dataclass
class Commitment:
    commitment_id: str
    operator: Address
    beneficiary: Address
    service_description: str
    duty_trigger: str
    duty_deadline: str
    dispute_deadline: str
    rulebook_version: u256
    locked_exposure: u256
    expected_action_id: str
    status: str
    accepted: bool
    duty_result_reference: str
    case_id: str
    created_at: str


@allow_storage
@dataclass
class ResolutionApplication:
    case_id: str
    commitment_id: str
    classification: str
    penalty_bps: u256
    penalty_amount: u256
    beneficiary_award: u256
    safety_pool_amount: u256
    beneficiary: Address
    applied: bool


@gl.contract_interface
class SlashCourtCallback:
    class Write:
        def record_resolution_applied(self, case_id: str, commitment_id: str) -> None: ...


class OperatorBondVault(gl.Contract):
    """Bond vault with commitment-level caps and replay-safe settlement."""

    governor: Address
    slash_court: Address
    court_configured: bool
    operators: TreeMap[Address, OperatorAccount]
    operator_addresses: DynArray[Address]
    commitments: TreeMap[str, Commitment]
    commitment_ids: DynArray[str]
    resolution_applications: TreeMap[str, ResolutionApplication]
    resolution_case_ids: DynArray[str]
    safety_pool_balance: u256
    award_balances: TreeMap[Address, u256]
    total_operators: u256
    global_total_bond: u256
    global_available_bond: u256
    global_locked_exposure: u256
    total_penalties_applied: u256

    def __init__(self):
        self.governor = gl.message.sender_address
        self.slash_court = gl.message.sender_address
        self.court_configured = False
        self.safety_pool_balance = 0
        self.total_operators = 0
        self.global_total_bond = 0
        self.global_available_bond = 0
        self.global_locked_exposure = 0
        self.total_penalties_applied = 0

    # ------------------------------------------------------------------
    # Deterministic validation and helpers
    # ------------------------------------------------------------------

    def _normalize_address(self, value: Address) -> Address:
        if isinstance(value, str):
            return Address(value)
        return value

    def _require_governor(self) -> None:
        if gl.message.sender_address != self.governor:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} governor authorization required")

    def _require_court(self) -> None:
        if not self.court_configured:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} SlashCourt is not configured")
        if gl.message.sender_address != self.slash_court:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} SlashCourt authorization required")

    def _require_registered(self, address: Address) -> OperatorAccount:
        if address not in self.operators:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} operator is not registered")
        return self.operators[address]

    def _validate_text(self, value: str, label: str, maximum: int) -> None:
        if len(value.strip()) == 0 or len(value) > maximum:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid {label}")

    def _validate_identifier(self, value: str, label: str, maximum: int) -> None:
        if len(value) == 0 or len(value) > maximum:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid {label} length")
        for character in value:
            if not (
                ("a" <= character <= "z")
                or ("A" <= character <= "Z")
                or ("0" <= character <= "9")
                or character == "-"
                or character == "_"
            ):
                raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid {label} characters")

    def _validate_deadline(self, value: str, label: str) -> None:
        self._validate_text(value, label, 64)
        if len(value) < 10:
            return
        if value[4] != "-" or value[7] != "-":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} {label} must be ISO-8601")

    def _date_like(self, value: str) -> bool:
        return len(value) >= 10 and value[4] == "-" and value[7] == "-"

    def _transaction_time(self) -> str:
        # v0.2 runners expose the raw transaction context as message_raw;
        # current runners expose the same field as message.datetime. Both are
        # transaction data and neither uses host wall-clock time.
        raw = getattr(gl, "message_raw", None)
        if raw is not None:
            return str(raw.get("datetime", "1970-01-01T00:00:00Z"))
        message = getattr(gl, "message", None)
        value = getattr(message, "datetime", None)
        if value is not None:
            return str(value)
        return "1970-01-01T00:00:00Z"

    def _expired(self, deadline: str) -> bool:
        # gl.message.datetime is transaction context, not host wall-clock
        # time. Date-only comparison keeps the storage representation bounded
        # and works with both the direct VM and full GenVM.
        if not self._date_like(deadline):
            return False
        now = self._transaction_time()
        return now[:10] > deadline[:10]

    def _classification_bps(self, classification: str) -> u256:
        if classification == "PROVABLE_MISCONDUCT":
            return FULL_SLASH_BPS
        if classification == "NEGLIGENT_FAILURE":
            return PARTIAL_SLASH_BPS
        if classification == "EXTERNAL_OUTAGE":
            return NO_SLASH_BPS
        if classification == "INSUFFICIENT_EVIDENCE":
            return NO_SLASH_BPS
        raise gl.vm.UserError(f"{ERROR_EXPECTED} unknown classification")

    def _commitment_to_dict(self, commitment: Commitment) -> dict:
        return {
            "commitment_id": commitment.commitment_id,
            "operator": commitment.operator.as_hex,
            "beneficiary": commitment.beneficiary.as_hex,
            "service_description": commitment.service_description,
            "duty_trigger": commitment.duty_trigger,
            "duty_deadline": commitment.duty_deadline,
            "dispute_deadline": commitment.dispute_deadline,
            "rulebook_version": commitment.rulebook_version,
            "locked_exposure": commitment.locked_exposure,
            "expected_action_id": commitment.expected_action_id,
            "status": commitment.status,
            "accepted": commitment.accepted,
            "duty_result_reference": commitment.duty_result_reference,
            "case_id": commitment.case_id,
            "created_at": commitment.created_at,
        }

    def _record_transfer(self, recipient: Address, amount: u256) -> None:
        # Current GenLayer uses a finalization-stage account transfer. The
        # ledger is reduced before queuing so a second provisional withdrawal
        # cannot spend the same claim; an appeal recomputes the parent state.
        # The pinned runner used by the local toolchain exposes the same
        # primitive through get_contract_at().emit_transfer(); current SDKs
        # expose it as gl.chain.Account.emit_transfer().
        gl.get_contract_at(recipient).emit_transfer(value=amount, on="finalized")

    def _withdraw_available(self, operator_address: Address, amount: u256) -> None:
        operator = self._require_registered(operator_address)
        if amount <= 0 or amount > operator.available_bond:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} available withdrawal exceeds balance")
        operator.available_bond -= amount
        operator.total_bond -= amount
        self.operators[operator_address] = operator
        self.global_available_bond -= amount
        self.global_total_bond -= amount
        self._record_transfer(operator_address, amount)

    # ------------------------------------------------------------------
    # Configuration and bond accounting
    # ------------------------------------------------------------------

    @gl.public.write
    def configure_court(self, court_address: Address) -> None:
        self._require_governor()
        court_address = self._normalize_address(court_address)
        if self.court_configured:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} SlashCourt already configured")
        if court_address.as_hex == ZERO_ADDRESS or court_address == self.governor:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid SlashCourt address")
        self.slash_court = court_address
        self.court_configured = True

    @gl.public.write
    def register_operator(self, metadata_uri: str) -> None:
        sender = gl.message.sender_address
        if sender in self.operators:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} operator already registered")
        self._validate_text(metadata_uri, "metadata URI", MAX_METADATA_URI_LENGTH)
        self.operators[sender] = OperatorAccount(
            metadata_uri=metadata_uri,
            total_bond=0,
            available_bond=0,
            locked_exposure=0,
            claimable_awards=0,
            active_commitments=0,
            resolved_commitments=0,
        )
        self.operator_addresses.append(sender)
        self.total_operators += 1

    def _credit_bond(self) -> None:
        amount = gl.message.value
        # The v0.18 GLSim transport currently preserves payable value in the
        # raw transaction envelope while its compatibility Message tuple can
        # expose zero. Prefer the typed field and fall back only when it is
        # absent so production runners remain on the documented API.
        if amount == 0:
            raw = getattr(gl, "message_raw", None)
            if raw is not None:
                amount = raw.get("value", 0)
        if amount <= 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} bond deposit must be positive")
        operator = self._require_registered(gl.message.sender_address)
        operator.total_bond += amount
        operator.available_bond += amount
        self.operators[gl.message.sender_address] = operator
        self.global_total_bond += amount
        self.global_available_bond += amount

    @gl.public.write.payable
    def deposit_bond(self) -> None:
        self._credit_bond()

    @gl.public.write.payable
    def top_up_bond(self) -> None:
        self._credit_bond()

    @gl.public.write
    def create_commitment(
        self,
        commitment_id: str,
        beneficiary: Address,
        service_description: str,
        duty_trigger: str,
        duty_deadline: str,
        dispute_deadline: str,
        rulebook_version: u256,
        locked_exposure: u256,
        expected_action_id: str,
    ) -> None:
        sender = gl.message.sender_address
        operator = self._require_registered(sender)
        beneficiary = self._normalize_address(beneficiary)
        self._validate_identifier(commitment_id, "commitment id", MAX_COMMITMENT_ID_LENGTH)
        if commitment_id in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment id already exists")
        if beneficiary.as_hex == ZERO_ADDRESS or beneficiary == sender:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} beneficiary must be distinct")
        self._validate_text(service_description, "service description", MAX_DESCRIPTION_LENGTH)
        self._validate_text(duty_trigger, "duty trigger", MAX_TRIGGER_LENGTH)
        self._validate_deadline(duty_deadline, "duty deadline")
        self._validate_deadline(dispute_deadline, "dispute deadline")
        if self._date_like(duty_deadline) and self._date_like(dispute_deadline):
            if duty_deadline[:10] > dispute_deadline[:10]:
                raise gl.vm.UserError(f"{ERROR_EXPECTED} dispute deadline precedes duty deadline")
        self._validate_identifier(expected_action_id, "expected action id", MAX_ACTION_LENGTH)
        if rulebook_version == 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} rulebook version is required")
        if locked_exposure <= 0 or locked_exposure > operator.available_bond:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} insufficient available bond")

        # Lock the exposure at offer creation. This prevents an operator from
        # promising the same bond twice while a beneficiary considers the offer.
        operator.available_bond -= locked_exposure
        operator.locked_exposure += locked_exposure
        self.operators[sender] = operator
        self.global_available_bond -= locked_exposure
        self.global_locked_exposure += locked_exposure
        self.commitments[commitment_id] = Commitment(
            commitment_id=commitment_id,
            operator=sender,
            beneficiary=beneficiary,
            service_description=service_description,
            duty_trigger=duty_trigger,
            duty_deadline=duty_deadline,
            dispute_deadline=dispute_deadline,
            rulebook_version=rulebook_version,
            locked_exposure=locked_exposure,
            expected_action_id=expected_action_id,
            status=STATUS_OFFERED,
            accepted=False,
            duty_result_reference="",
            case_id="",
            created_at=self._transaction_time(),
        )
        self.commitment_ids.append(commitment_id)

    @gl.public.write
    def accept_commitment(self, commitment_id: str) -> None:
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.status != STATUS_OFFERED:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment is not offered")
        if gl.message.sender_address != commitment.beneficiary:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} beneficiary authorization required")
        if self._expired(commitment.duty_deadline):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment offer expired")
        commitment.accepted = True
        commitment.status = STATUS_ACTIVE
        self.commitments[commitment_id] = commitment
        operator = self.operators[commitment.operator]
        operator.active_commitments += 1
        self.operators[commitment.operator] = operator

    @gl.public.write
    def cancel_unaccepted_commitment(self, commitment_id: str) -> None:
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.status != STATUS_OFFERED:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} only offered commitments can cancel")
        if gl.message.sender_address != commitment.operator:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} operator authorization required")
        commitment.status = STATUS_CANCELLED
        self.commitments[commitment_id] = commitment
        operator = self.operators[commitment.operator]
        operator.locked_exposure -= commitment.locked_exposure
        operator.available_bond += commitment.locked_exposure
        self.operators[commitment.operator] = operator
        self.global_locked_exposure -= commitment.locked_exposure
        self.global_available_bond += commitment.locked_exposure

    @gl.public.write
    def record_duty_result(self, commitment_id: str, result_reference: str) -> None:
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.status not in (STATUS_ACTIVE, STATUS_DUTY_REPORTED):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid duty-report state")
        if gl.message.sender_address not in (commitment.operator, commitment.beneficiary):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} duty-report authorization required")
        self._validate_text(result_reference, "duty result reference", MAX_DUTY_RESULT_LENGTH)
        commitment.duty_result_reference = result_reference
        commitment.status = STATUS_DUTY_REPORTED
        self.commitments[commitment_id] = commitment

    @gl.public.write
    def bind_case(self, case_id: str, commitment_id: str) -> None:
        self._require_court()
        self._validate_identifier(case_id, "case id", MAX_CASE_ID_LENGTH)
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.status not in (STATUS_ACTIVE, STATUS_DUTY_REPORTED, STATUS_DISPUTED):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment cannot be disputed")
        if commitment.case_id not in ("", case_id):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment already has a case")
        commitment.case_id = case_id
        commitment.status = STATUS_DISPUTED
        self.commitments[commitment_id] = commitment

    @gl.public.write
    def release_undisputed_commitment(self, commitment_id: str) -> None:
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.status not in (STATUS_ACTIVE, STATUS_DUTY_REPORTED):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment is not releasable")
        if commitment.case_id != "":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} disputed commitment cannot release")
        if self._date_like(commitment.dispute_deadline) and not self._expired(
            commitment.dispute_deadline
        ):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} dispute window is still open")
        if gl.message.sender_address not in (commitment.operator, commitment.beneficiary):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment party authorization required")
        commitment.status = STATUS_RELEASED
        self.commitments[commitment_id] = commitment
        operator = self.operators[commitment.operator]
        operator.locked_exposure -= commitment.locked_exposure
        operator.available_bond += commitment.locked_exposure
        if operator.active_commitments > 0:
            operator.active_commitments -= 1
        self.operators[commitment.operator] = operator
        self.global_locked_exposure -= commitment.locked_exposure
        self.global_available_bond += commitment.locked_exposure

    # ------------------------------------------------------------------
    # Finalized resolution application and withdrawals
    # ------------------------------------------------------------------

    @gl.public.write
    def apply_resolution(
        self,
        case_id: str,
        commitment_id: str,
        classification: str,
        penalty_bps: u256,
        beneficiary: Address,
    ) -> None:
        self._require_court()
        beneficiary = self._normalize_address(beneficiary)
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        commitment = self.commitments[commitment_id]
        if commitment.beneficiary != beneficiary:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} beneficiary mismatch")
        expected_bps = self._classification_bps(classification)
        if penalty_bps != expected_bps:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} penalty mapping mismatch")

        if case_id in self.resolution_applications:
            existing = self.resolution_applications[case_id]
            if (
                existing.commitment_id != commitment_id
                or existing.classification != classification
                or existing.penalty_bps != penalty_bps
                or existing.beneficiary != beneficiary
            ):
                raise gl.vm.UserError(f"{ERROR_EXPECTED} resolution replay payload mismatch")
            # A previous vault application may have succeeded while its
            # finality-safe callback was delayed. Requeue only the idempotent
            # acknowledgement; no balances are touched twice.
            SlashCourtCallback(self.slash_court).emit(on="finalized").record_resolution_applied(
                case_id, commitment_id
            )
            return

        if commitment.status not in (STATUS_DISPUTED, STATUS_ACTIVE, STATUS_DUTY_REPORTED):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment already resolved")

        exposure = commitment.locked_exposure
        penalty_amount = exposure * expected_bps // 10_000
        beneficiary_award = penalty_amount * BENEFICIARY_SHARE_BPS // 10_000
        safety_pool_amount = penalty_amount - beneficiary_award
        operator = self.operators[commitment.operator]
        if operator.locked_exposure < exposure:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} locked exposure accounting underflow")

        operator.locked_exposure -= exposure
        operator.total_bond -= penalty_amount
        operator.available_bond += exposure - penalty_amount
        operator.claimable_awards += 0
        if operator.active_commitments > 0:
            operator.active_commitments -= 1
        operator.resolved_commitments += 1
        self.operators[commitment.operator] = operator
        self.global_locked_exposure -= exposure
        self.global_total_bond -= penalty_amount
        self.global_available_bond += exposure - penalty_amount
        self.total_penalties_applied += penalty_amount

        if beneficiary in self.operators:
            beneficiary_account = self.operators[beneficiary]
            beneficiary_account.claimable_awards += beneficiary_award
            self.operators[beneficiary] = beneficiary_account
        # Awards belong to beneficiaries, not necessarily registered operators.
        # Keep a separate claimable map via the resolution record and a compact
        # address-indexed balance map declared below in the appended field.
        self.award_balances[beneficiary] = self.award_balances.get(beneficiary, 0) + beneficiary_award
        self.safety_pool_balance += safety_pool_amount

        commitment.status = STATUS_RESOLVED
        self.commitments[commitment_id] = commitment
        self.resolution_applications[case_id] = ResolutionApplication(
            case_id=case_id,
            commitment_id=commitment_id,
            classification=classification,
            penalty_bps=penalty_bps,
            penalty_amount=penalty_amount,
            beneficiary_award=beneficiary_award,
            safety_pool_amount=safety_pool_amount,
            beneficiary=beneficiary,
            applied=True,
        )
        self.resolution_case_ids.append(case_id)
        SlashCourtCallback(self.slash_court).emit(on="finalized").record_resolution_applied(
            case_id, commitment_id
        )

    @gl.public.write
    def withdraw_available(self, amount: u256) -> None:
        self._withdraw_available(gl.message.sender_address, amount)

    @gl.public.write
    def withdraw_award(self, amount: u256) -> None:
        sender = gl.message.sender_address
        claimable = self.award_balances.get(sender, 0)
        if amount <= 0 or amount > claimable:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} award withdrawal exceeds balance")
        self.award_balances[sender] = claimable - amount
        self._record_transfer(sender, amount)

    # ------------------------------------------------------------------
    # Views
    # ------------------------------------------------------------------

    @gl.public.view
    def get_operator(self, operator_address: Address) -> dict:
        operator_address = self._normalize_address(operator_address)
        if operator_address not in self.operators:
            return {
                "address": operator_address.as_hex,
                "registered": False,
                "metadata_uri": "",
                "total_bond": 0,
                "available_bond": 0,
                "locked_exposure": 0,
                "claimable_awards": self.award_balances.get(operator_address, 0),
                "active_commitments": 0,
                "resolved_commitments": 0,
            }
        operator = self.operators[operator_address]
        return {
            "address": operator_address.as_hex,
            "registered": True,
            "metadata_uri": operator.metadata_uri,
            "total_bond": operator.total_bond,
            "available_bond": operator.available_bond,
            "locked_exposure": operator.locked_exposure,
            "claimable_awards": self.award_balances.get(operator_address, 0),
            "active_commitments": operator.active_commitments,
            "resolved_commitments": operator.resolved_commitments,
        }

    @gl.public.view
    def get_balance_breakdown(self, operator_address: Address) -> dict:
        operator_address = self._normalize_address(operator_address)
        record = self.get_operator(operator_address)
        return {
            "total_bond": record["total_bond"],
            "available_bond": record["available_bond"],
            "locked_exposure": record["locked_exposure"],
            "claimable_awards": record["claimable_awards"],
            "safety_pool_balance": self.safety_pool_balance,
        }

    @gl.public.view
    def get_commitment(self, commitment_id: str) -> dict:
        if commitment_id not in self.commitments:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} commitment does not exist")
        return self._commitment_to_dict(self.commitments[commitment_id])

    @gl.public.view
    def get_commitment_ids(self, offset: u256, limit: u256) -> dict:
        if limit == 0 or limit > 50:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid page limit")
        end = offset + limit
        if end > len(self.commitment_ids):
            end = len(self.commitment_ids)
        ids = []
        index = offset
        while index < end:
            ids.append(self.commitment_ids[index])
            index += 1
        return {"ids": ids, "total": len(self.commitment_ids)}

    @gl.public.view
    def get_case_application(self, case_id: str) -> dict:
        if case_id not in self.resolution_applications:
            return {"case_id": case_id, "applied": False}
        application = self.resolution_applications[case_id]
        return {
            "case_id": application.case_id,
            "commitment_id": application.commitment_id,
            "classification": application.classification,
            "penalty_bps": application.penalty_bps,
            "penalty_amount": application.penalty_amount,
            "beneficiary_award": application.beneficiary_award,
            "safety_pool_amount": application.safety_pool_amount,
            "beneficiary": application.beneficiary.as_hex,
            "applied": application.applied,
        }

    @gl.public.view
    def get_vault_configuration(self) -> dict:
        return {
            "governor": self.governor.as_hex,
            "slash_court": self.slash_court.as_hex,
            "court_configured": self.court_configured,
            "full_slash_bps": FULL_SLASH_BPS,
            "partial_slash_bps": PARTIAL_SLASH_BPS,
            "beneficiary_share_bps": BENEFICIARY_SHARE_BPS,
            "safety_pool_share_bps": SAFETY_POOL_SHARE_BPS,
        }

    @gl.public.view
    def get_vault_statistics(self) -> dict:
        return {
            "total_operators": self.total_operators,
            "total_bond": self.global_total_bond,
            "available_bond": self.global_available_bond,
            "locked_exposure": self.global_locked_exposure,
            "total_penalties_applied": self.total_penalties_applied,
            "safety_pool_balance": self.safety_pool_balance,
        }
