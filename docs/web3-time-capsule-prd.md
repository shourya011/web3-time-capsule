# Web3 Time Capsule PRD

## 1. Executive Summary
Good ideas often emerge early but are hard to prove as original later. The Web3 Time Capsule lets users lock an "idea artifact" (text, hash of a document, encrypted payload, or prototype metadata) on-chain with a timelock (e.g. 12 months). When the unlock time arrives, the artifact (or its decryption key) is revealed, cryptographically proving authorship, timestamp, and immutability. The system is a lightweight, fun, and credible intellectual provenance layer for innovators, students, indie hackers, founders, researchers, artists, and writers.

MVP uses an EVM-compatible smart contract for commitment + unlock logic, optional IPFS/Arweave for content storage, and a web UI for submission and future viewing. Users can pick durations (e.g. 3, 6, 12, 24 months) with a default of 1 year. Stored data is either: (a) a direct small plaintext (<= N bytes), (b) a hash of larger content, or (c) an encrypted blob + future key reveal.

## 2. Problem Statement
- No easy neutral proof of original ideation timestamp.
- Centralized note apps are not trustless/verifiable and can be modified.
- Lawyers/patent paths are slow, expensive, and overkill for early brainstorming.
- Public posting too early risks idea leakage.
- Need a balance: prove you had it without disclosing it prematurely.

## 3. Vision & Value Proposition
"Press a button today; one year later the world can cryptographically verify you had that idea first." Provide:
- Trustless timestamp (block time + block hash inclusion)
- Locker abstraction (commit now, reveal later)
- Simple UX (like sending an email to your future self, but tamper-proof)
- Fun social reveal moment (public feed of newly unlocked capsules)

## 4. Goals
- G1: Let any user commit an idea artifact with a future unlock time.
- G2: Support multiple artifact types (raw text, hash-only, encrypted blob reference).
- G3: Enforce immutability: cannot edit/replace after commit.
- G4: Allow reveal flow (auto if plaintext; manual key publish if encrypted).
- G5: Provide a public explorer of unlocked capsules.
- G6: Gas-efficient minimal smart contract.
- G7: Educational + viral potential (shareable reveal pages).

### 4.1 Non-Goals (Initial MVP)
- Full legal IP protection / patent substitution.
- On-chain storage of large files.
- Built-in encryption service (user manages local encryption).
- Multi-chain bridging.
- Zero-knowledge private commitments (beyond simple hashing).

## 5. Target Users & Personas
- Indie Founder: Wants credibility later when pitching.
- Student/Researcher: Early hypothesis logging.
- Writer/Author: Plots, titles, twists.
- Artist/Designer: Concept sketches hashed.
- Developer: Protocol ideas or naming.
- Content Creator: Series outline.

## 6. User Stories
### MVP
1. As a user, I can connect my wallet and view my existing locked capsules.
2. As a user, I can create a capsule by entering text or uploading a file to hash locally.
3. As a user, I can optionally provide an encrypted version plus a salted hash.
4. As a user, I choose an unlock period (preset durations or custom within bounds).
5. As a user, I pay gas + small protocol fee (optional) and receive a confirmation.
6. As a user, after unlock time, I (or automatically) reveal the plaintext or key.
7. As any visitor, I can browse recently unlocked capsules.
8. As a user, I can export a cryptographic proof (JSON) for offline verification.

### Future
- Tagging & categorization.
- Social following / subscribe to upcoming reveals.
- Early partial reveal (redacted preview).
- Dispute / challenge window.
- Zero-knowledge commit to attributes (e.g., category) without revealing content.
- Multi-sig / team co-authorship.

## 7. Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Connect wallet (EVM) | P0 |
| FR2 | Submit capsule with payload type flag | P0 |
| FR3 | Store commitment (hash) + unlock timestamp | P0 |
| FR4 | Enforce non-modifiability | P0 |
| FR5 | Retrieve capsule metadata pre-unlock (limited fields) | P0 |
| FR6 | Reveal mechanism after unlock | P0 |
| FR7 | Public feed of unlocked capsules | P1 |
| FR8 | Export verification artifact | P1 |
| FR9 | Fee routing (treasury address) | P2 |
| FR10 | Optional encryption guidance (client-side) | P2 |

## 8. Feature Breakdown
### MVP
- Smart contract: commitCapsule(), revealCapsule(), view functions.
- UI: Create, My Capsules, Explore (unlocked), Capsule detail.
- Artifact types: RAW_TEXT (<= 2 KB), HASH_ONLY (keccak256 digest), ENCRYPTED (hash + contentRef URI + optional key placeholder).
- Auto display countdown.

### Phase 2
- Subscription to future reveals.
- Email / push notification integration (off-chain relayer).
- Fee discount NFT or loyalty token.

### Stretch
- zk-SNARK concealed attributes.
- DAO governance for fee tweaks.
- Cross-chain indexing aggregator.

## 9. User Flows (Textual)
### 9.1 Create Capsule Flow
1. User connects wallet.
2. Enters text OR selects file → client hashes (keccak256). If encrypted: user locally encrypts file (AES-GCM) → uploads encrypted blob to IPFS → gets CID.
3. Chooses unlock duration (valid range: now + 7 days to now + 730 days).
4. UI constructs payload: contentHash, contentRef (optional), type enum, unlockTime.
5. Calls commitCapsule(value?) paying gas (+fee). Contract emits CapsuleCommitted event.
6. UI shows success and local stores draft reveal materials (e.g., encryption key) in browser storage.

### 9.2 Reveal Flow (for encrypted)
1. Unlock time passes.
2. User returns; UI detects not yet revealed but eligible.
3. User provides plaintext or decryption key.
4. Contract revealCapsule(id, plaintextOrKey) verifies hash matches commitment.
5. Emits CapsuleRevealed event → indexer updates UI feed.

### 9.3 View Unlocked Capsule
- Visitor opens route /capsule/:id → fetch metadata + revealed data.
- Show proof: block number, tx hash, original commit timestamp, hash, reveal validation.

## 10. System Architecture
- On-Chain: Minimal CapsuleRegistry contract.
- Off-Chain: Static frontend + optional indexer (The Graph) for efficient queries.
- Storage: Small text optionally on-chain (if cheap) else IPFS; large artifacts = hash only.
- Optional encryption: all client-side; contract never sees secret until reveal.

### 10.1 Components
- Frontend (React/Next.js) with wagmi / ethers.js.
- Smart Contract (Solidity) deployed on Base or Polygon (low fees) initially.
- IPFS pinning via web3.storage or Pinata.
- Indexer: The Graph subgraph (future) or simple serverless cron for new unlock notifications.

## 11. Smart Contract Specification (Draft)
```solidity
enum CapsuleType { RAW_TEXT, HASH_ONLY, ENCRYPTED }

struct CapsuleMeta {
    address owner;
    uint64 unlockTime;
    CapsuleType cType;
    bytes32 contentHash;      // keccak256 of plaintext or file bytes (or of encrypted blob for ENCRYPTED commit + optional scheme tag)
    string contentRef;         // optional IPFS/Arweave CID for ENCRYPTED or HASH_ONLY
    bool revealed;
}

function commitCapsule(CapsuleType cType, bytes32 contentHash, string calldata contentRef, uint64 unlockTime) external payable returns (uint256 id);
// Constraints: unlockTime > block.timestamp + MIN && unlockTime <= block.timestamp + MAX
// Emits CapsuleCommitted(id, owner, unlockTime, cType, contentHash)

function revealCapsule(uint256 id, bytes calldata plaintextOrKey, string calldata finalRef) external; 
// For RAW_TEXT: expects original plaintext; recompute hash and match.
// For ENCRYPTED: expects decryption key OR plaintext (implementation decision). finalRef may supply decrypted content URI.
// Sets revealed = true. Emits CapsuleRevealed(id)

function getCapsule(uint256 id) external view returns (CapsuleMeta memory);
function totalCapsules() external view returns (uint256);

// Events
// event CapsuleCommitted(uint256 indexed id, address indexed owner, uint64 unlockTime, CapsuleType cType, bytes32 contentHash);
// event CapsuleRevealed(uint256 indexed id, string finalRef);
```

### 11.1 Gas Optimizations
- Pack struct to reduce storage slots (owner (20) + unlockTime (8) + type (1) + revealed (1) can be optimized with custom bit packing, keep readability first MVP).
- Consider using uint40 for timestamp if cheaper.

### 11.2 Error Handling
- Use custom errors: `error UnlockTimeOutOfRange(); error NotOwner(); error AlreadyRevealed(); error TooEarly(); error HashMismatch();`

## 12. Data Model
| Field | Location | Notes |
|-------|----------|-------|
| id | implicit index | incrementing counter |
| owner | on-chain | creator address |
| unlockTime | on-chain | epoch seconds |
| contentHash | on-chain | keccak256(commit) |
| cType | on-chain | enum |
| contentRef | on-chain (string) | optional URI (IPFS cid) |
| revealed | on-chain | bool |
| plaintext/key | off-chain until reveal | Provided at reveal |
| finalRef | on-chain via event | optional revealed content pointer |

## 13. Security & Threat Model
| Threat | Vector | Mitigation |
|--------|--------|------------|
| Front-running | Someone copies your payload before tx mined | Encourage hashing or encryption; using commit of hash only |
| Early disclosure | Plaintext visible on mempool | Default to hash-only or encryption for sensitive ideas |
| Tampering | Modify after commit | Contract forbids edits |
| Replay / duplicate | Re-commit stolen idea | Timestamp ordering still proves you were first if you committed earlier; optionally show earlier commit wins |
| Key loss (encrypted) | User loses key cannot reveal | Provide downloadable JSON backup; optional email reminder (off-chain) |
| Spam / bloat | Many junk capsules | Introduce small protocol fee; rate limit via base fee |
| Malicious content | Illegal data in plaintext | Encourage hash-only; moderation upon reveal page (off-chain filtering) |
| DoS gas grief | Huge strings | Enforce size limit for RAW_TEXT |

## 14. Privacy Considerations
- Encourage hash-only for sensitive material.
- Client-side encryption reference guide (AES-GCM, key derived from random 256-bit value stored locally until reveal).
- No PII required; wallet-based pseudonymity.

## 15. Compliance & Legal
- Terms of Service: disclaim not legal IP guarantee.
- User responsible for content legality on reveal.
- Jurisdiction purposely minimal—static informational service.

## 16. Performance & Scalability
- Contract O(1) operations per capsule.
- Read scaling via public RPC + optional indexer caching.
- Frontend incremental static regeneration for reveal feed.

## 17. Metrics & Analytics (KPIs)
- # Capsules committed (daily / cumulative)
- # Capsules revealed
- Avg lock duration
- % encryption vs plaintext vs hash-only
- Retention: users returning to reveal
- Viral: social shares per reveal page

## 18. Roadmap
| Phase | Timeline | Items |
|-------|----------|-------|
| Alpha | Week 1-2 | Contract draft + local tests, basic UI commit form |
| Beta  | Week 3-4 | Deployment to testnet, reveal flow, explore page |
| Launch| Week 5-6 | Mainnet (Base/Polygon), marketing landing, analytics |
| Post  | Week 7+  | Notifications, subscriptions, fee tuning, governance prep |

## 19. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Users think it grants IP rights | Misaligned expectations | Clear disclaimers & onboarding copy |
| Low retention until unlock (long time horizon) | Engagement drop | Add shorter durations + reminder system |
| Gas spikes | Barrier to usage | Choose low-fee chain; batch or sponsor reveals later |
| Lost encryption keys | Unrevealable capsules | UX emphasis + backup export |
| Offensive reveals | Reputation risk | Off-chain moderation flags; hide by default until approved (optional) |

## 20. Monetization Options
- Flat protocol fee per commit (e.g., $0.25 in native token).
- NFT minted upon reveal (soulbound optional) signifying originality badge.
- Premium features: notifications, early reveal analytics.
- Enterprise API (timestamp notarization).

## 21. Edge Cases
- UnlockTime exactly now + MIN boundary.
- User reveals immediately after block passes unlock—ensure `>=` logic.
- Hash mismatch on reveal (typo) → allow retry until success.
- Duplicate commits: allowed, each stands alone.
- Very long text attempted: reject early client + contract length check.

## 22. Open Questions
- Should reveal auto-execute for RAW_TEXT? (Could store plaintext off-chain + just show at time using scheduled indexer.)
- Include optional commit salt or let user manage? (Recommend user concats salt before hashing.)
- Multi-file artifact bundling? Use a directory CID? Future.
- Fee split to treasury vs burn mechanics? Future governance decision.

## 23. Glossary
- Capsule: A locked idea representation.
- Commitment: Hash recorded on-chain referencing future content.
- Reveal: Action validating original content matches hash.
- ContentRef: External storage pointer (IPFS CID / Arweave TX ID).
- Unlock Time: Earliest timestamp allowed for reveal.

## 24. Acceptance Criteria (MVP)
- Deploy contract to testnet; commit & reveal at least one RAW_TEXT and one ENCRYPTED sample.
- UI can show countdown and state (Locked vs Ready vs Revealed).
- Hash mismatch correctly reverts.
- Gas cost of commit < ~120k on chosen chain (target) with typical parameters.

## 25. Verification Process
- Unit tests: commitCapsule boundary tests; reveal unauthorized; early reveal revert; hash mismatch revert.
- Manual QA script: scenario matrix (plaintext, hash-only, encrypted).
- Security review: basic internal audit + static analysis (Slither). 

## 26. Future Enhancements
- zk proofs for attribute classification.
- Mobile wallet deep links.
- Social graph integration (Lens / Farcaster cast on reveal).

---
**Next Steps Recommendation**
1. Finalize chain choice (suggest Base for low cost + ecosystem). 
2. Draft Solidity contract and run tests. 
3. Build minimal React UI (commit + list + reveal). 
4. Add client-side encryption helper. 
5. Launch testnet beta and gather feedback. 

Let me know if you want the smart contract scaffold next or a README extraction.
