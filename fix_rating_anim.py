with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

css_code = """
        @keyframes starPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); fill: #eab308; }
            100% { transform: scale(1); }
        }
        .star-animate {
            animation: starPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
"""

if ".star-animate {" not in content:
    content = content.replace("</style>", css_code + "\n    </style>", 1)

old_rating_logic = """                document.querySelectorAll(`.star-rating-icon-${id}`).forEach((star, index) => {
                    if (index < rating) {
                        star.classList.remove('far', 'text-gray-600');
                        star.classList.add('fas', 'text-yellow-500');
                    } else {
                        star.classList.remove('fas', 'text-yellow-500');
                        star.classList.add('far', 'text-gray-600');
                    }
                });"""

new_rating_logic = """                document.querySelectorAll(`.star-rating-icon-${id}`).forEach((star, index) => {
                    if (index < rating) {
                        star.classList.remove('far', 'text-gray-600');
                        star.classList.add('fas', 'text-yellow-500', 'star-animate');
                        star.style.animationDelay = `${index * 0.05}s`;
                    } else {
                        star.classList.remove('fas', 'text-yellow-500', 'star-animate');
                        star.classList.add('far', 'text-gray-600');
                        star.style.animationDelay = '0s';
                    }
                });"""

content = content.replace(old_rating_logic, new_rating_logic)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
