import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# First, remove the duplicate @media (max-width: 768px) blocks I added
while "/* Mobile responsive detail modal */" in content:
    start_idx = content.find("/* Mobile responsive detail modal */")
    end_idx = content.find("</style>", start_idx)
    content = content[:start_idx] + content[end_idx:]


new_css = """
        /* Mobile responsive detail modal */
        @media (max-width: 768px) {
            .detail-content-flex {
                flex-direction: column;
                align-items: center;
                gap: 1.5rem !important;
                padding: 1.5rem 1rem !important;
            }
            .detail-poster {
                margin: 0 auto;
                width: 200px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
            }
            .detail-poster img {
                width: 100% !important;
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
                gap: 10px !important;
            }
            .interactive-rating {
                justify-content: center;
                margin-top: 10px;
                padding: 10px 0;
                font-size: 1.2rem;
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
                flex-direction: column;
                align-items: center;
                gap: 1rem !important;
                width: 100%;
            }
            .detail-actions .btn {
                width: 100%;
                justify-content: center;
                padding: 12px !important;
                font-size: 1rem !important;
            }
            .detail-actions > div {
                width: 100%;
                justify-content: center !important;
                margin-left: 0 !important;
            }
            .detail-desc {
                text-align: justify;
                font-size: 0.95rem !important;
                line-height: 1.5;
            }
            /* Cast & Crew */
            #dm-cast-container {
                margin-top: 1rem;
            }
            .cast-member img {
                width: 80px !important;
                height: 80px !important;
            }
            .cast-name {
                font-size: 0.8rem !important;
            }
            /* Comments */
            #comments-list {
                max-height: 300px;
            }
            #comment-input {
                font-size: 1rem;
            }
        }
        /* PC / Tablet layout enhancements */
        @media (min-width: 769px) {
            .detail-actions .btn {
                min-width: 150px;
            }
            .interactive-rating .rating-star {
                font-size: 1.2rem;
                padding: 5px;
            }
        }
        
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
"""

content = content.replace("</style>", new_css + "\n    </style>", 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied comprehensive responsive CSS")
