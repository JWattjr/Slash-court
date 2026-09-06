# Deployment

Use the official GenLayer CLI so its configured account and network handle
authentication:

```powershell
genlayer network set studionet
genlayer deploy
```

The script deploys and wires `OperatorBondVault` and `SlashCourt`, publishes
rulebook v1, configures the evidence-domain allowlist, verifies execution
success in every receipt, and writes `deploy/last-deployment.json` locally.

No private key belongs in this repository. Application bond deposits are
separate from transaction fees and require a funded test account.
