const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(PROJECT_ROOT, 'index.html');
const SW_JS = path.join(PROJECT_ROOT, 'sw.js');

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(msg, type = 'info') {
    const color = type === 'error' ? COLORS.red : type === 'success' ? COLORS.green : COLORS.reset;
    console.log(`${color}${msg}${COLORS.reset}`);
}

function checkFileExists(filePath, context) {
    const fullPath = path.join(PROJECT_ROOT, filePath.split('?')[0]); // Remove query params
    if (!fs.existsSync(fullPath)) {
        log(`[MISSING] ${filePath} (referenced in ${context})`, 'error');
        return false;
    }
    return true;
}

function verifyIndexTags() {
    log('--- Verifying index.html Links ---');
    const content = fs.readFileSync(INDEX_HTML, 'utf-8');
    const regex = /(?:href|src)=["']([^"']+)["']/g;
    let match;
    let errors = 0;

    while ((match = regex.exec(content)) !== null) {
        const url = match[1];
        if (url.startsWith('http') || url.startsWith('//') || url.startsWith('#')) continue;
        
        // Skip common external/dynamic paths if any, but explicitly check local
        if (!checkFileExists(url, 'index.html')) errors++;
    }
    return errors;
}

function verifyServiceWorker() {
    log('\n--- Verifying Service Worker Assets ---');
    const content = fs.readFileSync(SW_JS, 'utf-8');
    // Extract array content: const ASSETS = [ ... ];
    const match = content.match(/const ASSETS = \s*\[([\s\S]*?)\];/);
    if (!match) {
        log('Could not parse ASSETS array in sw.js', 'error');
        return 1;
    }

    const assets = match[1].split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(s => s && s !== '/'); // Skip root
    
    let errors = 0;
    assets.forEach(asset => {
        if (!checkFileExists(asset.startsWith('/') ? asset.slice(1) : asset, 'sw.js')) errors++;
    });
    return errors;
}

function checkSyntax() {
    log('\n--- Checking JS Syntax ---');
    let errors = 0;
    
    // Recursive file find
    function getJsFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'scripts') {
                    results = results.concat(getJsFiles(filePath));
                }
            } else if (file.endsWith('.js')) {
                results.push(filePath);
            }
        });
        return results;
    }

    const files = getJsFiles(PROJECT_ROOT);
    files.forEach(file => {
        try {
            execSync(`node -c "${file}"`, { stdio: 'ignore' });
        } catch (e) {
            log(`[SYNTAX ERROR] ${path.relative(PROJECT_ROOT, file)}`, 'error');
            errors++;
        }
    });
    
    if (errors === 0) log('All JS files passed syntax check.', 'success');
    return errors;
}

// Main Execution
try {
    let totalErrors = 0;
    totalErrors += verifyIndexTags();
    totalErrors += verifyServiceWorker();
    totalErrors += checkSyntax();

    console.log('\n=============================================');
    if (totalErrors === 0) {
        log('✅ PROJECT VERIFICATION PASSED', 'success');
        process.exit(0);
    } else {
        log(`❌ FOUND ${totalErrors} ERRORS`, 'error');
        process.exit(1);
    }
} catch (err) {
    console.error('Verification script failed:', err);
}
