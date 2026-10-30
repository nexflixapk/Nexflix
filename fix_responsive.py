import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will inject some CSS into the head or the style block.
css_to_add = """
        /* Mobile responsive detail modal */
        @media (max-width: 768px) {
            .detail-content-flex {
                flex-direction: column;
                align-items: center;
                gap: 1.5rem !important;
                padding: 2rem 1rem !important;
            }
            .detail-poster {
                margin: 0 auto;
                width: 180px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
            }
            .detail-poster img {
                width: 180px !important;
            }
            #dm-title {
                font-size: 2rem !important;
                text-align: center;
            }
            #dm-original-title {
                text-align: center;
                font-size: 1rem !important;
            }
            .detail-meta {
                justify-content: center;
                flex-wrap: wrap;
            }
            #dm-genre {
                display: block !important;
                text-align: center;
                margin: 0 auto;
                width: fit-content;
            }
            .detail-extra-info {
                flex-direction: column;
                gap: 0.5rem !important;
                align-items: center;
                text-align: center;
            }
            .detail-actions {
                justify-content: center;
                gap: 0.5rem !important;
            }
            .detail-actions .btn {
                padding: 10px 16px !important;
                font-size: 0.95rem !important;
                width: 100%;
                justify-content: center;
            }
            .detail-actions > div {
                width: 100%;
                justify-content: center !important;
                margin-left: 0 !important;
                margin-top: 0.5rem;
            }
            .detail-desc {
                text-align: center;
                font-size: 0.95rem !important;
            }
        }
"""

# Insert this before </style>
content = content.replace("</style>", css_to_add + "\n    </style>")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Responsive CSS added")
