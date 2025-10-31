# Быстрое развертывание ChamLing на AWS

## Простое развертывание за 10 минут

### Шаг 1: Подготовка Frontend

```bash
cd cham_ling

# Создайте .env.production с URL вашего бэкенда
echo "REACT_APP_API_URL=https://your-backend-url.com" > .env.production

# Соберите приложение
npm install
npm run build
```

### Шаг 2: Создание S3 Bucket

```bash
# Замените chamling-frontend на ваше уникальное имя bucket
aws s3 mb s3://chamling-frontend --region us-east-1

# Загрузите файлы
aws s3 sync build/ s3://chamling-frontend --delete

# Сделайте bucket публичным
aws s3 website s3://chamling-frontend \
  --index-document index.html \
  --error-document index.html
```

### Шаг 3: Подготовка Backend

```bash
cd ../cham_ling_app_BE/cham_ling

# Установите EB CLI если еще не установлен
pip install awsebcli

# Инициализируйте
eb init -p python-3.9 chamling-backend --region us-east-1

# Создайте окружение
eb create chamling-production --instance-type t3.small

# Установите переменные окружения (замените значения!)
eb setenv \
  SECRET_KEY=your-secret-key-min-50-chars \
  DEBUG=False \
  ALLOWED_HOSTS=*.elasticbeanstalk.com \
  CORS_ALLOWED_ORIGINS=https://chamling-frontend.s3-website-us-east-1.amazonaws.com \
  UNSPLASH_API_KEY=your-key-here

# Деплой
eb deploy
```

### Шаг 4: Выполнение миграций

```bash
eb ssh
cd /var/app/current
source /var/app/venv/*/bin/activate
python manage.py migrate
python manage.py createsuperuser
exit
```

### Шаг 5: Обновление URL бэкенда во Frontend

```bash
cd ../../cham_ling

# Получите URL вашего бэкенда
eb status

# Обновите .env.production с реальным URL
# Запустите повторную сборку и деплой
npm run build
aws s3 sync build/ s3://chamling-frontend --delete
```

## Проверка

- Frontend: `http://chamling-frontend.s3-website-us-east-1.amazonaws.com`
- Backend: `http://chamling-production.elasticbeanstalk.com`

## Следующие шаги

1. Настройте CloudFront для CDN
2. Добавьте SSL сертификат
3. Настройте кастомный домен
4. Подключите RDS для базы данных

Подробности в `AWS_DEPLOY.md`

