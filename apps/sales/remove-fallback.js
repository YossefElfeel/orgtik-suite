const fs = require('fs');

function replaceFallbacks(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = dir + '/' + file.name;
    if (file.isDirectory()) {
      replaceFallbacks(fullPath);
    } else if (file.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match exactly: , { fallback: "some string" }
      // This is a naive regex but works for the simple cases we have.
      content = content.replace(/,\s*\{\s*fallback\s*:\s*[`"'][^`"']*[`"']\s*\}/g, '');
      
      // Match case: { days, fallback: "..." }
      content = content.replace(/,\s*fallback\s*:\s*[`"'][^`"']*[`"']/g, '');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceFallbacks('d:/Somion/sales-dashboardv2/components/pages/subscriptions');
replaceFallbacks('d:/Somion/sales-dashboardv2/app/[locale]/(dashboard)/subscriptions');

console.log('Done replacing fallbacks.');
