# Feature Specification: Refactor Header and Navigation

**Feature Branch**: `002-refactor-header-ui`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "1. Refactoring the Badges into a Top Banner: Refactor the existing header component. Locate the current separate badges for [Ramadan Timing] and [W4 • On Campus (Drop Only)]. Remove these individual pill-shaped elements and combine their text into a single, edge-to-edge slim banner positioned at the very top of the screen, above the main navigation. Use a [muted gold/yellow] background with small, centered, legible text. Ensure this refactor removes any unnecessary vertical margins that were previously used by the separate badges. 2. Cleaning up the Main Title Area: Update the main title area of the existing header. Remove any bounding boxes, dark background shapes, or borders around the title section. Refactor the layout so that the main title [BIS Schedule Search] is bold and left-aligned, with the subtitle [Level 3 • Semester 2] directly underneath it in a smaller, muted gray font. Additionally, target the [Made by Tyson] button: remove its solid purple background and convert it into a minimal, subtle text tag or link on the far right side of the title row, keeping the [LinkedIn icon]. 3. Converting to a Native Segmented Control: Refactor the view-switching navigation in the header. Locate the current separate buttons for [Schedule] and [Live]. Transform them into a single, full-width, iOS-style segmented control. The container should have a subtle dark background, and the active state should use a [purple] accent color block that slides or clearly indicates the active selection, while the inactive text remains muted. Ensure the touch targets remain large enough for mobile."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Minimalist Top Banner (Priority: P1)

As a user, I want a clean, unified way to see special timing and campus status information so that the header looks less cluttered.

**Why this priority**: High. This establishes the new layout hierarchy and removes the "pill" clutter that currently occupies the main header area.

**Independent Test**: Can be fully tested by verifying that "Ramadan Timing" and "W4 • On Campus (Drop Only)" appear in a single slim yellow banner at the absolute top of the viewport.

**Acceptance Scenarios**:

1. **Given** the application is loaded with special indicators active, **When** the page renders, **Then** I should see a single, edge-to-edge slim banner at the very top of the screen.
2. **Given** the top banner is visible, **When** I check its style, **Then** it should have a muted gold/yellow background with small, centered, legible text.
3. **Given** the top banner is active, **When** I inspect the main header, **Then** there should be no separate pill-shaped badges for Ramadan or Campus status within the header branding section.

---

### User Story 2 - Clean Main Title Area (Priority: P2)

As a user, I want a minimalist title area with clear typography so that the branding feels premium and modern.

**Why this priority**: Medium. Significant visual improvement that aligns with modern "typography-first" design trends.

**Independent Test**: Can be tested by inspecting the title row for the absence of backgrounds/borders and verifying the new alignment.

**Acceptance Scenarios**:

1. **Given** the header is rendered, **When** I look at the title "BIS Schedule Search", **Then** it should be bold, left-aligned, and have no bounding box or background shape.
2. **Given** the main title is visible, **When** I look directly underneath it, **Then** I should see "Level 3 • Semester 2" in a smaller, muted gray font.
3. **Given** the title row, **When** I look to the far right, **Then** I should see "Made by Tyson" as a subtle text link with a LinkedIn icon, with no solid purple background.

---

### User Story 3 - Native Segmented Control (Priority: P2)

As a mobile and desktop user, I want a cohesive view switcher that feels like a native OS component so that navigation is intuitive and tactile.

**Why this priority**: Medium. Improves the interactive feel of the application and follows mobile best practices.

**Independent Test**: Can be tested by switching between "Schedule" and "Live" views and observing the sliding purple accent block.

**Acceptance Scenarios**:

1. **Given** the application navigation, **When** I look at the view switcher, **Then** I should see a single, iOS-style segmented control with a subtle dark background.
2. **Given** the segmented control, **When** I tap or click a view option, **Then** a purple accent color block should slide or clearly indicate the active selection.
3. **Given** mobile view, **When** I interact with the segmented control, **Then** the touch targets should be large enough to be easily tappable.

---

### Edge Cases

- **Multiple Special Indicators**: How does the top banner handle both "Ramadan Timing" and "Campus Status" simultaneously? (Assumption: Combined text strings).
- **Long Subtitle**: How does the subtitle handle narrow mobile screens when left-aligned? (Assumption: Wraps or truncates safely).
- **Navigation Overflow**: Does the segmented control remain full-width on mobile but capped on desktop? (Assumption: Follows container constraints).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST render a `div` or `section` as a top-level banner above the `header`.
- **FR-002**: System MUST combine indicators into the top banner text (e.g., "Ramadan Timing • W4 • On Campus (Drop Only)").
- **FR-003**: System MUST remove all CSS styles related to bounding boxes and dark backgrounds for the `brand` and `brand-title-row` elements.
- **FR-004**: System MUST position the "Made by Tyson" link on the `flex-end` (right) of the title row.
- **FR-005**: System MUST implement a segmented control component that manages the "active" state visibility centrally.
- **FR-006**: System MUST ensure the purple accent block in the segmented control has a transition/animation effect for the active state change.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Header vertical height is reduced by at least 15% (by moving badges to the banner and removing margins).
- **SC-002**: 100% of "heavy" visual borders and backgrounds are removed from the title area.
- **SC-003**: Segmented control buttons meet a minimum 44px height for mobile accessibility.
- **SC-004**: Transition between "Schedule" and "Live" views in the segmented control takes no longer than 300ms.
