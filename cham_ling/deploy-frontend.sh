#!/bin/bash

# Скрипт для деплоя фронтенда на AWS S3 + CloudFront

set -e  # Остановка при ошибке

echo "🚀 Начинаем деплой фронтенда..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка переменных окружения
if [ -z "$AWS_S3_BUCKET" ]; then
  echo -e "${RED}❌ Ошибка: AWS_S3_BUCKET не установлен${NC}"
  exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "${YELLOW}⚠️  Предупреждение: CLOUDFRONT_DISTRIBUTION_ID не установлен, инвалидация CloudFront пропущена${NC}"
fi

# Сборка приложения
echo -e "${GREEN}📦 Сборка React приложения...${NC}"
npm install
npm run build

if [ ! -d "build" ]; then
  echo -e "${RED}❌ Ошибка: папка build не найдена${NC}"
  exit 1
fi

# Загрузка в S3
echo -e "${GREEN}☁️  Загрузка в S3 bucket: $AWS_S3_BUCKET...${NC}"
aws s3 sync build/ s3://$AWS_S3_BUCKET --delete

echo -e "${GREEN}✅ Файлы загружены в S3${NC}"

# Инвалидация CloudFront кеша
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "${GREEN}🔄 Инвалидация CloudFront кеша...${NC}"
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
  
  echo -e "${GREEN}✅ Инвалидация CloudFront создана${NC}"
fi

echo -e "${GREEN}🎉 Деплой завершен успешно!${NC}"

