# Feature: Shared UI Components

## Objective
Build all reusable UI components declared in ADR: MessageBubble, StreamingBubble, InlineButtons, ComposerBar, VoiceRecorder, EmojiPicker, SlashCommandSheet, CodeBlock, Toast, ConnectionBadge, AgentAvatar, MediaGrid, FileList, MarkdownRenderer.

## Dependencies
- Project Scaffold
- Zustand State Stores (for data-binding in ComposerBar, ChatStore, etc.)

## Stack
- React Native core components
- React Native markdown rendering (for MarkdownRenderer)
- expo-av / expo-audio (for VoiceRecorder)

## Expected output
- `components/` folder with all 14 shared components
- Each component is typed, tested, and follows the ADR's v1→v2 mapping
- Components are pure enough to render in isolation (Storybook-style)
- TypeScript strict mode passes

## Status
[ ] Not started
