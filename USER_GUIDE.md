# ZenTrack: Operator Adaptation Portal

Welcome to the ZenTrack Automated Reconciliation Engine. This guide provides the tactical steps required to synchronize your payment registries and establish a secure communication flow.

## 🏁 Phase 1: Identity Initialization (Level 01)
Before any reconciliation can occur, the system requires a verified mapping of party codes to communication channels.

1.  **Navigate to [Parties](/parties)**: Access the Identity Management hub.
2.  **Bulk Import**: Click `Bulk Registry Import` to upload your `.xlsx` or `.csv` mapping file.
    - **Schema**: Ensure your file contains `Party Code`, `Party Name`, `Email`, and optional `CC` columns.
3.  **Verification**: Once imported, the system will mark entities as `VERIFIED`. These are now available for reconciliation.

## 🔄 Phase 2: The Reconciliation Engine (Level 02)
With your identities mapped, you can now process raw payment sheets.

1.  **Navigate to [Reconciliation](/reconciliation)**: Access the clustering core.
2.  **Payload Injection**: Drag and drop your daily payment statement (.xlsx).
3.  **Sync to Database**: 
    - **Toggle ON**: Automatically updates the central party registry if new email data is found in the sheet.
    - **Toggle OFF**: Performs a "Local Only" cluster for one-time dispatches.
4.  **Initiate Clustering**: Click the primary action button. The system will now group transactions by Party Code and prepare transmission payloads.

## 📡 Phase 3: Automation Dispatch (Level 03)
Verify your data before broadcasting statements to the verified entities.

1.  **Navigate to [Email Sender](/sender)**: Review the generated batches.
2.  **Transmission Preview**: Inspect the "Commit Preview" window. This shows the exact statement that will be sent to each party.
3.  **Broadcast Payload**: Execute the `Commit & Broadcast` protocol. The system uses secure SMTP routing to transmit the reconciliation statements.

## 📝 Phase 4: Intelligence & Audit (Level 04)
Track every byte transmitted through the platform for compliance.

1.  **Navigate to [Logs & Reports](/logs)**: Access the historical telemetry stream.
2.  **Audit Trail**: Review `Transaction Time`, `Target Entity`, and `Outcome`.
3.  **Error Recovery**: If a dispatch fails, the `Outcome` column will provide the exact diagnostic info from the SMTP node.

---

> [!IMPORTANT]
> **Mission Command Widget**: Look for the floating Compass icon in the bottom-right corner of your screen. This widget tracks your progress through these 4 phases and provides direct navigation to each module.

> [!TIP]
> Use the **Global Sync** button (top bar) if you suspect local data has diverged from the server-side registry.
