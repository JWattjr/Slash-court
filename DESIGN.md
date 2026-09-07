---
name: SlashCourt
description: An editorial trust-tech interface for evidence-bound, appealable settlement.
colors:
  signal-cobalt: "#315fe8"
  warm-paper: "#f4f4f1"
  evidence-white: "#ffffff"
  evidence-blue: "#e3e9ff"
  operator-green: "#dcf1da"
  warm-sheet: "#f1eee6"
  carbon-ink: "#151515"
  body-soft: "#40413d"
  metadata-muted: "#64645f"
  rule-line: "#d8d8d2"
  rule-line-strong: "#bcbdb6"
  warning-amber: "#9a5b00"
  settlement-red: "#bf3131"
  settlement-green: "#207a3f"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(54px, 5.2vw, 76px)"
    fontWeight: 730
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 42px)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.05em"
rounded:
  control: "999px"
  field: "10px"
  panel: "14px"
  dossier: "16px"
spacing:
  xs: "7px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "26px"
components:
  button-primary:
    backgroundColor: "{colors.signal-cobalt}"
    textColor: "{colors.evidence-white}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
    typography: "{typography.body}"
  evidence-panel:
    backgroundColor: "{colors.evidence-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.panel}"
    padding: "18px"
  text-field:
    backgroundColor: "{colors.evidence-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
    typography: "{typography.body}"
---

# Design System: SlashCourt

## Overview

**Creative North Star: "The Public Decision Dossier"**

SlashCourt should feel like an institutional case file made legible to the public: composed, inspectable, and exact without becoming bureaucratic. Warm paper and ruled evidence sheets create trust through material restraint; cobalt is reserved for actions, links, and chain-of-custody signals.

The interface is editorial trust-tech, not a crypto trading terminal. Public understanding leads, while contract metadata remains available in a disciplined mono layer. Every state must distinguish observed network truth from preview structure, especially when StudioNet reads are unavailable.

**Key Characteristics:**

- Warm institutional paper with crisp evidence sheets.
- Strong editorial headlines paired with compact mono provenance.
- Role-specific pale blue Submit and pale green Operate workspaces.
- Plain-language state labels backed by visible contract details.
- Restrained motion and depth centered on the decision dossier.

## Colors

The palette combines warm documentary neutrals with one decisive cobalt voice and quiet semantic sheets.

### Primary

- **Signal Cobalt:** Use for primary actions, links, focus, active navigation, and evidence-chain marks. Its rarity gives it authority.

### Secondary

- **Evidence Blue:** Use as the claimant/public-evidence field and the dossier mast.
- **Operator Green:** Use only for operator workflows and successful settlement states.

### Tertiary

- **Warning Amber:** Use for unavailable, pending, and caution states; never imply a healthy live connection with it.
- **Settlement Red:** Use for destructive outcomes and field errors, not decoration.

### Neutral

- **Warm Paper:** The page ground and default atmospheric field.
- **Evidence White:** Primary panels, controls, and case sheets.
- **Warm Sheet:** Empty states and low-emphasis inset material.
- **Carbon Ink:** Headlines and decisive content.
- **Body Soft / Metadata Muted:** Supporting explanation and provenance.
- **Rule Line / Strong Rule Line:** Structure hierarchy without heavy containers.

### Named Rules

**The One Signal Rule.** Cobalt is the only general-purpose accent; semantic colors stay bound to their states and roles.

**The Truthful State Rule.** Unavailable network reads use neutral or amber language and never coexist with a green live indicator or fabricated values.

## Typography

**Display Font:** Bricolage Grotesque (with system sans-serif fallback)

**Body Font:** Bricolage Grotesque (with system sans-serif fallback)

**Label/Mono Font:** Azeret Mono (with system monospace fallback)

**Character:** Bricolage gives the product an assured editorial voice; Azeret Mono turns hashes, state, and provenance into a compact technical annotation layer rather than the dominant personality.

### Hierarchy

- **Display:** Tight, heavy, balanced headlines reserved for the opening product promise.
- **Headline:** Compact section titles that separate public inspection from role-specific work.
- **Title:** Medium-weight panel and dossier titles.
- **Body:** Comfortable explanatory copy, generally held to roughly 65 characters per line.
- **Label:** Uppercase mono metadata at a readable minimum size; use sparingly for provenance, statuses, and field labels.

### Named Rules

**The Two-Voice Rule.** Sans-serif explains and persuades; mono identifies and proves. Never set long explanatory paragraphs in mono.

## Layout

The desktop opening is a two-part editorial composition: promise and actions on the left, a chain-of-custody dossier on the right. Content sits in a centered wide canvas with generous vertical pauses, followed by a ruled metric strip, the public case ledger, and visibly separate Submit and Operate workspaces.

Navigation remains sticky beneath the product bar. Section targets include the sticky offset so headings are always visible. Below the tablet breakpoint, the hero becomes one column. On phones, explanation and primary actions must precede the dossier; forms collapse to one column and role sheets extend close to the viewport edge without horizontal overflow.

## Elevation & Depth

The system is flat by default. Borders, tonal sheets, and ruled subdivisions provide structure. Only the hero dossier receives a substantial ambient shadow, making the public decision artifact the single lifted object; modal depth is functional and may be stronger.

### Shadow Vocabulary

- **Dossier Ambient:** A broad low-opacity shadow used only for the hero case file.
- **Modal Focus:** A stronger deep shadow used only while a case file blocks the page.

### Named Rules

**The One Lifted Artifact Rule.** Do not turn routine panels into floating cards; preserve depth for the dossier and active modal.

## Shapes

Panels use gently rounded institutional sheets, fields use a slightly tighter radius, and controls use full pills. Fine one-pixel rules define evidence rows and grids. The form language is soft enough to invite use but never glossy, bubbly, or toy-like.

## Components

### Buttons

- **Shape:** Confident pill controls with compact padding.
- **Primary:** Cobalt fill with white text; reserve for the next consequential action.
- **Hover / Focus:** Slight upward movement on hover and a visible cobalt focus ring; reduced-motion preferences remove meaningful animation.
- **Ghost / Text:** Ghost buttons use a strong hairline; text actions use a simple underline.

### Chips

- **Style:** Small mono pills on pale semantic grounds.
- **State:** A colored dot and explicit copy must agree; unknown or unavailable states remain neutral.

### Cards / Containers

- **Corner Style:** Gently rounded evidence sheets.
- **Background:** White for records, pale blue for claimant flow, pale green for operator flow, warm inset for emptiness.
- **Shadow Strategy:** Flat except for the signature dossier and modal.
- **Border:** Fine neutral rules.
- **Internal Padding:** Compact on ledgers, generous on editorial and empty states.

### Inputs / Fields

- **Style:** White field, strong neutral stroke, compact radius, dark text, and readable muted placeholders.
- **Focus:** Cobalt border plus a soft outer ring.
- **Error / Disabled:** Red border with field-local recovery text; disabled actions reduce opacity but retain readable labels.

### Navigation

The product bar and four-destination section navigation are sticky. Active destinations use dark text, a centered cobalt rule, and `aria-current`; mobile keeps all four destinations reachable in one horizontal row.

### Decision Dossier

The signature artifact binds claim, commitment, exposure, evidence, decision sequence, and deployed contract links into one public sheet. On load it opens center-out; reduced-motion users receive the final state immediately. When reads fail, it becomes an explicitly labelled structural preview and withholds live values.

## Do's and Don'ts

### Do:

- **Do** lead with the public promise and a concrete inspection action.
- **Do** show provenance beside plain-language decisions.
- **Do** separate beneficiary and operator work with their established tonal fields.
- **Do** preserve keyboard focus, reduced motion, readable metadata, and field-local recovery.
- **Do** use ruled evidence structure before adding shadows or decoration.

### Don't:

- **Don't** imitate a dark crypto admin dashboard, terminal, or trading screen.
- **Don't** display synthetic fixtures, stale snapshots, or structural previews as live network truth.
- **Don't** use gradients, decorative glow, excessive cards, or interchangeable rounded-dashboard styling.
- **Don't** bury the primary public action beneath a tall artifact on mobile.
- **Don't** let technical metadata overpower the claim, evidence, or decision.
