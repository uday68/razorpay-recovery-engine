import re
import os

page_mappings = {
    "Overview.tsx": "frontend/stitch_payment_recovery_control_tower/recovery_overview/code.html",
    "LiveRecovery.tsx": "frontend/stitch_payment_recovery_control_tower/payment_recovery_control_tower/code.html",
    "PaymentInvestigation.tsx": "frontend/stitch_payment_recovery_control_tower/payment_investigation_pay_9281/code.html",
    "Experiments.tsx": "frontend/stitch_payment_recovery_control_tower/recovery_experiments/code.html",
    "AIIntelligence.tsx": "frontend/stitch_payment_recovery_control_tower/ai_decision_intelligence/code.html",
    "SystemHealth.tsx": "frontend/stitch_payment_recovery_control_tower/system_health/code.html",
    "Policies.tsx": "frontend/stitch_payment_recovery_control_tower/recovery_policies/code.html",
    "AuditLog.tsx": "frontend/stitch_payment_recovery_control_tower/audit_log/code.html",
}

svg_attr_map = {
    "preserveaspectratio": "preserveAspectRatio",
    "viewbox": "viewBox",
    "stroke-width": "strokeWidth",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "fill-opacity": "fillOpacity",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "clip-path": "clipPath",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
}

import json

def html_style_to_jsx(style_str):
    styles = {}
    for item in style_str.split(';'):
        item = item.strip()
        if not item or ':' not in item:
            continue
        key, val = item.split(':', 1)
        key = key.strip()
        val = val.strip()
        parts = key.split('-')
        camel_key = parts[0] + ''.join(p.capitalize() for p in parts[1:])
        styles[camel_key] = val
    items = [f"{k}: {json.dumps(v)}" for k, v in styles.items()]
    return "{{" + ", ".join(items) + "}}"

def convert_html_to_jsx(html_content, component_name):
    # Extract <main> ... </main>
    match = re.search(r'<main[^>]*>(.*?)</main>', html_content, re.DOTALL)
    if not match:
        print(f"Warning: No <main> found for {component_name}")
        main_content = html_content
    else:
        main_content = match.group(1)

    # 1. Strip <script>...</script> tags entirely
    jsx = re.sub(r'<script\b[^>]*>.*?</script>', '', main_content, flags=re.DOTALL | re.IGNORECASE)

    # 2. Escape literal < that is not an HTML tag or comment
    jsx = re.sub(r'<(?![a-zA-Z/!])', '&lt;', jsx)

    # 3. Escape >, {, } in text content between tags
    def escape_text(m):
        txt = m.group(1)
        txt = txt.replace('>', '&gt;').replace('{', '&#123;').replace('}', '&#125;')
        return '>' + txt + '<'
    
    # Run multiple passes to catch adjacent text nodes if any
    jsx = re.sub(r'>([^<]+)<', escape_text, jsx)

    # 4. Convert comments
    jsx = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', jsx, flags=re.DOTALL)

    # 5. Convert class to className
    jsx = re.sub(r'\bclass=', 'className=', jsx)

    # 6. Convert for to htmlFor
    jsx = re.sub(r'\bfor=', 'htmlFor=', jsx)

    # 7. Convert style="..." to style={{ ... }}
    def style_replacer(m):
        return f"style={html_style_to_jsx(m.group(1))}"
    jsx = re.sub(r'style="([^"]*)"', style_replacer, jsx)

    # 8. Convert SVG attributes
    for old_attr, new_attr in svg_attr_map.items():
        jsx = re.sub(rf'\b{old_attr}=', f'{new_attr}=', jsx, flags=re.IGNORECASE)

    # 9. Fix SVG tag names (React JSX is case sensitive for SVG tags)
    svg_tags = {
        'lineargradient': 'linearGradient',
        'radialgradient': 'radialGradient',
        'clippath': 'clipPath',
        'textpath': 'textPath',
    }
    for old_t, new_t in svg_tags.items():
        jsx = re.sub(rf'<{old_t}\b', f'<{new_t}', jsx, flags=re.IGNORECASE)
        jsx = re.sub(rf'</{old_t}>', f'</{new_t}>', jsx, flags=re.IGNORECASE)

    # 10. Self close ONLY true HTML void tags: input, img, br, hr, col
    void_tags = ['input', 'img', 'br', 'hr', 'col']
    for tag in void_tags:
        pattern = rf'(<{tag}\b(?![^>]*/>)([^>]*?))>'
        jsx = re.sub(pattern, r'\1 />', jsx, flags=re.IGNORECASE)

    # 11. Remove all inline event handlers (onclick, oninput, onsubmit, onchange, etc.)
    jsx = re.sub(r'\bon[a-z]+="[^"]*"', '', jsx, flags=re.IGNORECASE)

    # 12. Fix boolean attributes
    boolean_attrs = ['disabled', 'readonly', 'required', 'autofocus', 'multiple', 'hidden', 'selected', 'open']
    for b_attr in boolean_attrs:
        jsx = re.sub(rf'\b{b_attr}="[^"]*"', b_attr, jsx, flags=re.IGNORECASE)
    jsx = re.sub(r'\bchecked="[^"]*"', 'defaultChecked', jsx, flags=re.IGNORECASE)
    jsx = re.sub(r'\breadonly="[^"]*"', 'readOnly', jsx, flags=re.IGNORECASE)

    # Wrap in React functional component
    component_code = f"""import React from 'react';

export const {component_name}: React.FC = () => {{
  return (
    <div className="w-full">
      {jsx.strip()}
    </div>
  );
}};

export default {component_name};
"""
    return component_code

if __name__ == '__main__':
    for filename, filepath in page_mappings.items():
        comp_name = filename.replace('.tsx', '')
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                html = f.read()
            jsx_code = convert_html_to_jsx(html, comp_name)
            out_path = os.path.join('frontend/src/pages', filename)
            with open(out_path, 'w', encoding='utf-8') as out_f:
                out_f.write(jsx_code)
            print(f"Generated {out_path} ({len(jsx_code)} bytes)")
        else:
            print(f"File not found: {filepath}")

