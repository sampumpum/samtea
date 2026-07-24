#!/bin/bash
# SAM TEA — деплой бота. Двойной клик — каталог уедет на GitHub,
# Vercel автоматически обновит https://samtea.vercel.app за ~30 секунд.
cd "$(dirname "$0")" || exit 1
echo "=== SAM TEA deploy ==="

# убрать зависший lock от прерванного git-процесса (частая причина сбоя)
if [ -f .git/index.lock ]; then rm -f .git/index.lock && echo "(убрал зависший .git/index.lock)"; fi

echo "Папка: $(pwd)"
echo ""
git add -A
git commit -m "Полный каталог: 72 позиции, артикулы, фото, новые категории" || echo "(нечего коммитить — возможно уже закоммичено)"
echo ""
echo "Пушу на GitHub (может занять минуту — фото ~37 МБ)..."
git push origin main
echo ""
echo "Готово. Открой https://samtea.vercel.app через ~30 сек (или vercel.com/samtea — вкладка Deployments)."
read -p "Нажми Enter, чтобы закрыть окно..."
