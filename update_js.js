const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/details-view/g, 'details-modal');

// In openDetail, we want to remove the code that hides other views, and just show the modal.
const hideViewsCode = `
            // Hide other views, show details
            document.getElementById('main-view').style.display = 'none';
            document.getElementById('grid-view').style.display = 'none';
            if(document.getElementById('dashboard-view')) document.getElementById('dashboard-view').style.display = 'none';
            if(document.getElementById('player-view')) document.getElementById('player-view').style.display = 'none';
            
            document.getElementById('details-modal').style.display = 'block';
            window.scrollTo({top:0});
`;

const newShowCode = `
            // Show details modal
            const dm = document.getElementById('details-modal');
            dm.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => dm.classList.add('active'), 10);
            
            // Add a global close function if not exists
            if (!window.closeDetailsModal) {
                window.closeDetailsModal = function() {
                    const dm = document.getElementById('details-modal');
                    dm.classList.remove('active');
                    setTimeout(() => {
                        dm.style.display = 'none';
                        document.body.style.overflow = '';
                        document.getElementById('player-view').style.display = 'none';
                    }, 300);
                }
            }
`;

content = content.replace(hideViewsCode, newShowCode);

fs.writeFileSync('index.html', content);
