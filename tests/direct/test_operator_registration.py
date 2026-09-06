from tests.direct.conftest import as_address


def test_register_and_deposit(direct_vm, direct_deploy, direct_alice):
    vault = direct_deploy("contracts/operator_bond_vault.py")
    direct_vm.sender = direct_alice

    vault.register_operator("https://keeper.example/operator.json")
    direct_vm.value = 100
    vault.deposit_bond()
    direct_vm.value = 0

    account = vault.get_operator(as_address(direct_alice))
    assert account["registered"] is True
    assert account["total_bond"] == 100
    assert account["available_bond"] == 100
