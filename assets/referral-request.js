/* Minimal, local-only inquiry composer. No cookies, storage, network calls or CRM keys. */
(function (root) {
  'use strict';
  var sources = {
    chatgpt: 'ChatGPT', claude: 'Claude', perplexity: 'Perplexity',
    google: 'Google Search / Gemini', bing: 'Bing / Copilot',
    linkedin: 'LinkedIn', partner: 'Partner referral', other: 'Other'
  };
  var topics = { fit: 'Free Fit Call', review: '$495 readiness review', partner: 'Partner discussion', workshop: 'Workshop interest (no date announced)' };
  function own(map, value) { return Object.prototype.hasOwnProperty.call(map, value); }
  function clean(value) { return String(value || '').replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim().slice(0, 100); }
  function detect(href, referrer) {
    try {
      var u = new URL(href), tag = (u.searchParams.get('utm_source') || '').toLowerCase();
      var aliases = { 'chatgpt.com': 'chatgpt', 'claude.ai': 'claude', 'claude.com': 'claude', 'perplexity.ai': 'perplexity' };
      if (own(aliases, tag)) tag = aliases[tag];
      if (own(sources, tag)) return { source: tag, basis: 'link tag (unverified)' };
    } catch (_) { /* Unknown remains unknown. */ }
    try {
      var h = new URL(referrer).hostname.toLowerCase();
      var domains = { 'chatgpt.com': 'chatgpt', 'chat.openai.com': 'chatgpt', 'claude.ai': 'claude', 'claude.com': 'claude', 'perplexity.ai': 'perplexity', 'www.perplexity.ai': 'perplexity', 'www.google.com': 'google', 'google.com': 'google', 'gemini.google.com': 'google', 'www.bing.com': 'bing', 'bing.com': 'bing', 'copilot.microsoft.com': 'bing', 'www.linkedin.com': 'linkedin', 'linkedin.com': 'linkedin' };
      if (own(domains, h)) return { source: domains[h], basis: 'referrer hostname (unverified)' };
    } catch (_) { /* No referrer is not evidence of direct or AI traffic. */ }
    return { source: '', basis: 'none available' };
  }
  function compose(data, observed) {
    var topic = own(topics, data.topic) ? topics[data.topic] : topics.fit;
    var self = own(sources, data.source) ? sources[data.source] : 'Not provided';
    var observedSource = observed && own(sources, observed.source) ? sources[observed.source] : 'Unknown';
    var observedBasis = observed && observed.basis === 'link tag (unverified)' ? 'link tag (unverified)' : observed && observed.basis === 'referrer hostname (unverified)' ? 'referrer hostname (unverified)' : 'none available';
    var lines = ['Hello Onyx,', '', 'I would like information about: ' + topic, 'Business: ' + (clean(data.company) || 'Not provided'), 'How I heard about Onyx (my answer): ' + self, '', 'Optional technical referral signal: ' + (data.includeSignal ? observedSource + ' / ' + observedBasis : 'Not shared'), '', 'Please reply to this email about this request. This is not a booking, purchase or marketing subscription.', '', 'Please do not include contract files, CUI, passwords or sensitive technical details.'];
    var body = lines.join('\n');
    return { body: body, href: 'mailto:ezra@onyxcmmc.com?subject=' + encodeURIComponent('Onyx inquiry: ' + topic) + '&body=' + encodeURIComponent(body) };
  }
  function mount(doc, loc) {
    var signal = detect(loc.href, doc.referrer);
    // Carry only a known source enum to this site's inquiry page; never copy arbitrary query data.
    if (signal.source) {
      Array.prototype.forEach.call(doc.querySelectorAll('a[data-onyx-inquiry]'), function (link) {
        try {
          var current = new URL(loc.href), target = new URL(link.href, current.href);
          if (target.origin !== current.origin || target.pathname !== '/readiness-review/') return;
          target.searchParams.set('utm_source', signal.source);
          link.href = target.href;
        } catch (_) { /* Keep the original working link. */ }
      });
    }
    var form = doc.getElementById('onyx-inquiry');
    if (!form) return;
    var hint = doc.getElementById('referral-hint');
    hint.textContent = signal.source ? 'Optional signal: ' + sources[signal.source] + ' from ' + signal.basis + '. This is not a confirmed referral.' : 'No referral signal is available. You can optionally tell us how you found us.';
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var result = compose({ company: form.elements.company.value, topic: form.elements.topic.value, source: form.elements.source.value, includeSignal: form.elements.includeSignal.checked }, signal);
      doc.getElementById('email-preview').value = result.body;
      doc.getElementById('open-email').href = result.href;
      doc.getElementById('email-result').hidden = false;
      doc.getElementById('inquiry-status').textContent = 'Draft prepared on this page only. Nothing has been sent. Open your email app and send it, or copy the text into an email to ezra@onyxcmmc.com.';
      doc.getElementById('open-email').focus();
    });
    doc.getElementById('prepare-email').disabled = false;
  }
  var api = { detect: detect, compose: compose, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) mount(root.document, root.location);
})(typeof window !== 'undefined' ? window : globalThis);
