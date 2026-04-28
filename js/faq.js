// FAQ.JS — Frequently Asked Questions content

function initFaq() {
  const container = document.getElementById('faqContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="faq-page">
      <div class="faq-header">
        <div class="faq-header-title">Help &amp; FAQ</div>
        <div class="faq-header-subtitle">Guides for setting up integrations used by Travel Planner</div>
      </div>

      <div class="faq-body">

        <!-- ── Google Maps ─────────────────────────────────────── -->
        <div class="faq-section" id="faq-google-maps">
          <div class="faq-section-eyebrow">Google Maps</div>
          <h2 class="faq-section-title">How to get a Google Maps API key</h2>
          <p class="faq-intro">
            Travel Planner uses the Google Maps JavaScript API to show interactive maps inside your section views.
            The key is free for personal use — Google gives you $200 of free credit per month, which is far more than this app will ever use.
          </p>

          <div class="faq-steps">
            <div class="faq-step">
              <div class="faq-step-num">1</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Go to Google Cloud Console</div>
                <p>Open <a href="https://console.cloud.google.com" target="_blank" rel="noopener" class="faq-link">console.cloud.google.com</a> and sign in with your Google account.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">2</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create or select a project</div>
                <p>Click the project dropdown at the top of the page. Either select an existing project or click <strong>New Project</strong>. Give it a name like <em>"Travel Planner"</em> and click <strong>Create</strong>.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">3</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Enable the Maps JavaScript API</div>
                <p>In the left sidebar go to <strong>APIs &amp; Services → Library</strong>. Search for <em>"Maps JavaScript API"</em> and click <strong>Enable</strong>.</p>
                <div class="faq-tip">
                  <span class="faq-tip-icon">💡</span>
                  You only need the Maps JavaScript API. You don't need Places, Directions, or any other Maps product.
                </div>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">4</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create an API key</div>
                <p>Go to <strong>APIs &amp; Services → Credentials</strong>. Click <strong>+ Create Credentials → API Key</strong>. Your new key (starting with <code>AIza</code>) will appear — copy it.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">5</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Restrict the key to your domain <span class="faq-badge faq-badge-recommended">Recommended</span></div>
                <p>Click on the key name, then under <strong>Application restrictions</strong> select <strong>HTTP referrers (websites)</strong>. Add your Vercel domain:</p>
                <div class="faq-code">https://your-app.vercel.app/*</div>
                <p style="margin-top:8px;">This ensures your key can only be used by your own app — not by anyone who finds it in the browser's network tab.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">6</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Set up billing (required, but free)</div>
                <p>Google requires a billing account to use Maps APIs, even for free-tier usage. Go to <strong>Billing</strong> in the console and link a credit card. You won't be charged — the $200/month free credit covers personal use many times over.</p>
                <div class="faq-tip">
                  <span class="faq-tip-icon">🛡️</span>
                  Google does not charge automatically beyond the free tier without explicit confirmation. Set a budget alert at $1 if you want peace of mind.
                </div>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">7</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Paste the key into Settings</div>
                <p>Go to <strong>Settings → Google Maps</strong>, paste your key into the API Key field, and click <strong>Save</strong>.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-divider"></div>

        <!-- ── Claude AI ────────────────────────────────────────── -->
        <div class="faq-section" id="faq-claude">
          <div class="faq-section-eyebrow">Claude AI</div>
          <h2 class="faq-section-title">How to get a Claude API key</h2>
          <p class="faq-intro">
            The Travel Agent tab uses Claude AI to answer travel questions. You need an Anthropic API key, which requires a paid account (usage-based billing, no monthly fee).
          </p>

          <div class="faq-steps">
            <div class="faq-step">
              <div class="faq-step-num">1</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create an Anthropic account</div>
                <p>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener" class="faq-link">console.anthropic.com</a> and sign up.</p>
              </div>
            </div>
            <div class="faq-step">
              <div class="faq-step-num">2</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Add a credit card and buy credits</div>
                <p>Go to <strong>Billing</strong> and add a payment method. Purchase a small credit top-up — $5 will last a very long time for casual chat use.</p>
              </div>
            </div>
            <div class="faq-step">
              <div class="faq-step-num">3</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create an API key</div>
                <p>Go to <strong>API Keys</strong> and click <strong>+ Create Key</strong>. Copy the key (starts with <code>sk-ant-</code>) — you won't be able to see it again.</p>
              </div>
            </div>
            <div class="faq-step">
              <div class="faq-step-num">4</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Paste into Settings</div>
                <p>Go to <strong>Settings → Claude AI</strong>, paste the key into the API Key field, click <strong>Save</strong>, then <strong>Test Connection</strong> to verify it works.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-divider"></div>

        <!-- ── Vercel KV ───────────────────────────────────────── -->
        <div class="faq-section" id="faq-vercel-kv">
          <div class="faq-section-eyebrow">Vercel KV</div>
          <h2 class="faq-section-title">How to enable cross-device user accounts</h2>
          <p class="faq-intro">
            By default, user accounts are stored in your browser's localStorage — which means they only exist on the device where they were created.
            Connecting a Vercel KV (Redis) store moves credentials to the server so every device shares the same user list.
          </p>

          <div class="faq-steps">
            <div class="faq-step">
              <div class="faq-step-num">1</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Open your project in the Vercel dashboard</div>
                <p>Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" class="faq-link">vercel.com/dashboard</a>, select your Travel Planner project, then click the <strong>Storage</strong> tab.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">2</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create a KV store</div>
                <p>Click <strong>Connect Store → Create New → KV</strong>. Give it a name (e.g. <em>travel-portal-kv</em>) and choose the region closest to you. Accept the defaults and click <strong>Create</strong>.</p>
                <div class="faq-tip">
                  <span class="faq-tip-icon">💡</span>
                  The Vercel KV free tier (256 MB) is more than enough for storing user accounts.
                </div>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">3</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Copy the REST API credentials</div>
                <p>On the KV store page, click the <strong>REST API</strong> tab. You need two values:</p>
                <div class="faq-code">KV_REST_API_URL=https://&lt;your-kv&gt;.upstash.io
KV_REST_API_TOKEN=&lt;long-token-string&gt;</div>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">4</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Add the environment variables</div>
                <p>Go to your project <strong>Settings → Environment Variables</strong>. Add these three variables for <em>Production</em>, <em>Preview</em>, and <em>Development</em>:</p>
                <div class="faq-code">KV_REST_API_URL   → (from step 3)
KV_REST_API_TOKEN → (from step 3)
AUTH_SALT         → (any random string — e.g. run: openssl rand -hex 32)</div>
                <div class="faq-tip">
                  <span class="faq-tip-icon">🛡️</span>
                  <code>AUTH_SALT</code> is mixed into password hashes — it doesn't need to be secret, but it should be unique to your deployment and never change.
                </div>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">5</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Redeploy the project</div>
                <p>Go to the <strong>Deployments</strong> tab and click <strong>Redeploy</strong> on the latest deployment (choose <em>Redeploy without cache</em>). The new env vars take effect only after a new deployment.</p>
              </div>
            </div>

            <div class="faq-step">
              <div class="faq-step-num">6</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Re-create your accounts</div>
                <p>Existing localStorage accounts are <strong>not</strong> migrated automatically. After redeployment, go to <strong>Settings → Account → Create User</strong> to create your accounts on the server. All devices will see these accounts immediately.</p>
                <div class="faq-tip">
                  <span class="faq-tip-icon">💡</span>
                  The first account created gets the <span class="faq-badge faq-badge-recommended">admin</span> role automatically.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-divider"></div>

        <!-- ── Telegram ─────────────────────────────────────────── -->
        <div class="faq-section" id="faq-telegram">
          <div class="faq-section-eyebrow">Telegram</div>
          <h2 class="faq-section-title">How to set up Telegram notifications</h2>
          <p class="faq-intro">
            Travel Planner can send trip reminders and alerts to you via a personal Telegram bot. Setup takes about 2 minutes.
          </p>

          <div class="faq-steps">
            <div class="faq-step">
              <div class="faq-step-num">1</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Create a bot via BotFather</div>
                <p>Open Telegram and search for <strong>@BotFather</strong>. Send <code>/newbot</code>, give it a name and username (e.g. <em>MyTravelBot</em>). BotFather will reply with your <strong>Bot Token</strong> — copy it.</p>
              </div>
            </div>
            <div class="faq-step">
              <div class="faq-step-num">2</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Start a chat with your bot</div>
                <p>Search for your bot's username in Telegram and tap <strong>Start</strong>. This is required before the bot can send you messages.</p>
              </div>
            </div>
            <div class="faq-step">
              <div class="faq-step-num">3</div>
              <div class="faq-step-body">
                <div class="faq-step-title">Paste the token into Settings</div>
                <p>Go to <strong>Settings → Telegram</strong>, paste the Bot Token, then click <strong>Get Chat ID</strong> — the app will auto-detect your personal chat ID from the conversation. Click <strong>Save</strong> then <strong>Test</strong>.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

console.log('✅ FAQ module loaded');
