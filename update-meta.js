// سكريبت Node.js لتحديث meta tags في index.html من إعدادات Supabase
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// إعدادات الاتصال بـ Supabase
const SUPABASE_URL =
  'https://vmrhpcgobywlwxohcyec.supabase.co/rest/v1/store_settings?select=*';
const SUPABASE_KEY = 'ضع هنا مفتاح الخدمة (anon key) من إعدادات supabase';

// مسار ملف index.html
const INDEX_PATH = path.join(__dirname, 'index.html');

async function main() {
  // جلب إعدادات المتجر
  const res = await fetch(SUPABASE_URL, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.error('لم يتم العثور على إعدادات المتجر!');
    process.exit(1);
  }
  const settings = data[0];

  // قراءة index.html
  let html = fs.readFileSync(INDEX_PATH, 'utf8');

  // تحديث <title>
  html = html.replace(
    /<title>([\s\S]*?)<\/title>/,
    `<title>${
      settings.meta_title || settings.store_name || 'سفير العطور'
    }</title>`
  );

  // تحديث meta description
  html = html.replace(
    /<meta name="description" content="([^"]*)"\s*\/>/,
    `<meta name="description" content="${
      settings.meta_description || settings.store_description || ''
    }" />`
  );

  // تحديث favicon
  if (settings.favicon_url) {
    html = html.replace(
      /<link rel="icon"[^>]*>/,
      `<link rel="icon" type="image/png" href="${settings.favicon_url}" />`
    );
  }

  // إضافة أو تحديث og:image
  if (settings.og_image_url) {
    if (html.includes('property="og:image"')) {
      html = html.replace(
        /<meta property="og:image" content="([^"]*)"\s*\/>/,
        `<meta property="og:image" content="${settings.og_image_url}" />`
      );
    } else {
      html = html.replace(
        '</head>',
        `  <meta property="og:image" content="${settings.og_image_url}" />\n  </head>`
      );
    }
  }

  // حفظ التغييرات
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log('تم تحديث meta tags في index.html بنجاح!');
}

main();
