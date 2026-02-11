# Inclusive Prototyping Software

**Research Application Project**

---

## Project Overview

This research application addresses critical accessibility gaps in UI prototyping tools like Figma, which create barriers for visually impaired designers and newcomers to the field. By developing a semantic, intent-driven prototyping tool, we aim to make the prototyping phase of the software development lifecycle inclusive and equitable for all team members, regardless of visual ability or experience level.

---

## Problem Statement

Current UI prototyping software presents significant challenges:
- Limited screen reader support prevents visually impaired users from effectively navigating or creating prototypes using assistive technologies.
- Steep learning curves overwhelm beginners.
- Visual-first design prioritizes visual fidelity over semantic meaning.
- Exclusion from co-design prevents developers with disabilities from participating effectively in the critical prototyping phase of the SDLC.

These gaps lead to:
- Visually impaired developers being unable to work effectively with their teams.
- Critical perspectives missing from prototype development.
- Accessibility being treated as an afterthought rather than a core design principle.

---

## Research Questions

**1. How can semantic, intent-driven prototyping enable assistive technologies to both interact with and modify web application prototypes during the design phase?**

This question explores moving beyond visual-only representations to create prototypes that expose their structure, roles, and behaviors in ways assistive technologies can understand and manipulate.

**2. How can shared semantic representations of interface structure and behavior support equitable co-design among designers, developers, and assistive technology users?**

This question investigates how semantic prototypes can serve as shared working documents that enable all team members—regardless of ability—to propose, test, and refine interface changes directly.

**Contemporary Context:** Current prototyping tools prioritize visual fidelity, producing artifacts largely inaccessible to assistive technologies. Our research addresses this gap by exploring how semantic, intent-based prototypes can function as editable, accessible artifacts rather than static visual representations.

---

## Solution Objectives

**Objective 1: Implement Semantic Markup-Based Prototype Representation**

Develop a JSON-based semantic schema that stores component intent and relationships rather than visual properties, ensuring screen readers can convey design structure meaningfully.

**Objective 2: Establish Real-Time Collaborative Annotations Supporting Multiple Input Modalities**

Implement a multi-modal feedback system where team members can contribute annotations, comments, and design suggestions through text, audio descriptions, or structured semantic edits accessible to all collaborators regardless of ability.

**Objective 3: Build Progressive Disclosure Interface with Keyboard-Navigable Workflows**

Design a hierarchical information architecture with collapsible semantic trees and context-sensitive command menus that expose basic functions by default while keeping advanced features accessible through predictable navigation patterns.

**Objective 4: Ensure Semantic-Visual Synchronization with <100ms Latency**

Maintain bidirectional real-time synchronization between the semantic prototype representation and visual rendering, ensuring changes made through either modality propagate instantly to create a shared source of truth.

---

## Technical Approach

- **Object-Oriented Programming:** Break design components into separate parts with clear, understandable roles.
- **Multithreading:** Enable simultaneous checks for labels, structure, and accessibility rule compliance.
- **JSON Schema:** Store semantic prototype representations with component intent and relationships.
- **Web Standards:** Integrate ARIA roles, semantic HTML, and accessibility APIs for assistive technology compatibility.

---
