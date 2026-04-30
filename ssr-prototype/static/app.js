// Minimal vanilla JS for the SSR prototype.
// Three behaviors: count-up animation, file name preview, accordion (handled natively by <details>).

document.addEventListener('DOMContentLoaded', function () {
  runCountUp();
  setupFileInputs();
});

// Count-up animation for offer amounts marked with data-countup="<target>".
function runCountUp() {
  var els = document.querySelectorAll('[data-countup]');
  els.forEach(function (el) {
    var target = parseInt(el.getAttribute('data-countup'), 10);
    if (!target || isNaN(target)) return;

    var start = 0;
    var duration = 1200; // ms
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = formatMXN(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatMXN(target);
      }
    }

    requestAnimationFrame(step);
  });
}

// Show selected file name below the upload area.
function showFileName(input, spanId) {
  var span = document.getElementById(spanId);
  if (!span) return;
  if (input.files && input.files.length > 0) {
    span.textContent = input.files[0].name;
  } else {
    span.textContent = '';
  }
}

// Format an integer as $X,XXX,XXX (MXN style, matches Go formatMXN).
function formatMXN(n) {
  if (!n) return '$0';
  var s = String(Math.round(n));
  var parts = [];
  while (s.length > 3) {
    parts.unshift(s.slice(-3));
    s = s.slice(0, -3);
  }
  parts.unshift(s);
  return '$' + parts.join(',');
}
