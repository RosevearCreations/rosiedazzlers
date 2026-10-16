# Build 559 preview recovery

Cloudflare's successful deployment of commit `5c0f0b6` was observed under a successor feature branch, not proved for Build 559's branch identity. This checkpoint is a source-only, non-behavioural change to request a fresh Git-triggered preview for the Build 559 branch. Acceptance must still verify the NEW exact commit SHA, branch `build559-rendered-derivative-private-verification`, preview status, Functions and immutable URL. It must not treat a different branch's deployment as equivalent.
