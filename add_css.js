const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const cssToAdd = `
        /* Netflix Style Detail Modal */
        #details-modal {
            background: rgba(0, 0, 0, 0.7);
            z-index: 2000;
            overflow-y: auto;
            backdrop-filter: blur(5px);
        }
        #details-modal .modal-content {
            border: none;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
            transform: scale(0.95);
            transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: auto;
        }
        #details-modal.active .modal-content {
            transform: scale(1);
        }
        .detail-hero-banner {
            position: relative;
            width: 100%;
            height: 450px;
            background-size: cover;
            background-position: center;
            border-radius: 12px 12px 0 0;
        }
        .detail-hero-vignette {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 150px;
            background: linear-gradient(to top, #181818 10%, transparent);
        }
        .detail-hero-content {
            position: absolute;
            bottom: 30px;
            left: 40px;
            right: 40px;
            z-index: 2;
        }
        .detail-body-content {
            padding: 0 40px 40px 40px;
            color: #fff;
        }
        @media (max-width: 768px) {
            #details-modal { padding-top: 0 !important; }
            #details-modal .modal-content { width: 100% !important; border-radius: 0 !important; min-height: 100vh; margin-bottom: 0 !important; }
            .detail-hero-banner { height: 350px; border-radius: 0; }
            .detail-hero-content { left: 20px; right: 20px; bottom: 20px; }
            .detail-body-content { padding: 0 20px 20px 20px; }
        }
`;

const insertIndex = content.indexOf('</style>');
const finalHTML = content.substring(0, insertIndex) + cssToAdd + content.substring(insertIndex);
fs.writeFileSync('index.html', finalHTML);
