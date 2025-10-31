# Развертывание ChamLing на AWS

Это руководство поможет развернуть приложение ChamLing на AWS.

## Архитектура развертывания

- **Frontend (React)**: S3 + CloudFront
- **Backend (Django)**: Elastic Beanstalk или EC2
- **База данных**: RDS PostgreSQL
- **Медиа файлы**: S3 Bucket
- **CDN**: CloudFront для фронтенда

## Предварительные требования

1. AWS Account с настроенными правами доступа
2. AWS CLI установлен и настроен
3. Node.js и npm для сборки фронтенда
4. Python 3.9+ для бэкенда

## Шаг 1: Подготовка Frontend

### 1.1. Сборка React приложения

```bash
cd cham_ling
npm install
npm run build
```

Это создаст папку `build/` с собранным приложением.

### 1.2. Настройка переменных окружения

Создайте файл `.env.production` в корне проекта:

```env
REACT_APP_API_URL=https://your-backend-domain.com
```

Или обновите `src/api/auth.js` чтобы использовать переменную окружения:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-domain.com';
```

### 1.3. Создание S3 Bucket для Frontend

```bash
# Создать bucket
aws s3 mb s3://chamling-frontend --region us-east-1

# Настроить публичный доступ (для статических файлов)
aws s3 website s3://chamling-frontend --index-document index.html --error-document index.html

# Загрузить build
aws s3 sync build/ s3://chamling-frontend --delete

# Настроить политику доступа
aws s3api put-bucket-policy --bucket chamling-frontend --policy file://bucket-policy.json
```

Создайте файл `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::chamling-frontend/*"
    }
  ]
}
```

### 1.4. Настройка CloudFront

```bash
# Создать CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

Пример `cloudfront-config.json`:
```json
{
  "CallerReference": "chamling-frontend-2024",
  "Comment": "ChamLing Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "chamling-s3",
        "DomainName": "chamling-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "chamling-s3",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "Compress": true
  },
  "Enabled": true
}
```

## Шаг 2: Подготовка Backend

### 2.1. Создание requirements.txt

Убедитесь, что файл `requirements.txt` содержит все зависимости:

```
Django==4.2.14
djangorestframework==3.16.1
djangorestframework-simplejwt==5.5.1
django-cors-headers==4.8.0
python-decouple==3.8
Pillow==11.0.0
psycopg2-binary==2.9.10
gunicorn==21.2.0
requests==2.32.5
```

### 2.2. Создание S3 Bucket для медиа файлов

```bash
# Создать bucket для медиа
aws s3 mb s3://chamling-media --region us-east-1

# Настроить CORS
aws s3api put-bucket-cors --bucket chamling-media --cors-configuration file://cors-config.json
```

`cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 2.3. Настройка RDS PostgreSQL

```bash
# Создать RDS instance
aws rds create-db-instance \
  --db-instance-identifier chamling-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username chamling \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp2 \
  --publicly-accessible \
  --backup-retention-period 7
```

### 2.4. Развертывание на Elastic Beanstalk

1. Установите EB CLI:
```bash
pip install awsebcli
```

2. Инициализируйте приложение:
```bash
cd cham_ling_app_BE/cham_ling
eb init -p python-3.9 chamling-backend --region us-east-1
```

3. Создайте окружение:
```bash
eb create chamling-production \
  --instance-type t3.small \
  --envvars SECRET_KEY=your-secret-key,DEBUG=False,ALLOWED_HOSTS=chamling-backend.elasticbeanstalk.com
```

4. Настройте переменные окружения через EB Console:
- `SECRET_KEY`: секретный ключ Django
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: ваш домен
- `RDS_DB_NAME`: имя базы данных
- `RDS_USERNAME`: пользователь БД
- `RDS_PASSWORD`: пароль БД
- `RDS_HOSTNAME`: хост RDS
- `RDS_PORT`: `5432`
- `UNSPLASH_API_KEY`: ваш API ключ Unsplash

5. Деплой:
```bash
eb deploy
```

### 2.5. Выполнение миграций

После деплоя выполните миграции:

```bash
eb ssh
cd /var/app/current
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
```

## Шаг 3: Настройка Django для продакшена

Обновите `settings.py`:

```python
# Настройки для медиа файлов в S3
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='chamling-media')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

## Шаг 4: Настройка домена и SSL

1. Получите SSL сертификат через AWS Certificate Manager
2. Настройте CloudFront для использования SSL
3. Настройте Route 53 для вашего домена (опционально)

## Шаг 5: Автоматизация деплоя

### 5.1. Создайте скрипт деплоя фронтенда

Создайте `deploy-frontend.sh`:

```bash
#!/bin/bash
cd cham_ling
npm install
npm run build
aws s3 sync build/ s3://chamling-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 5.2. CI/CD с GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      - name: Deploy to S3
        run: |
          aws s3 sync build/ s3://chamling-frontend --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Deploy to Elastic Beanstalk
        run: |
          pip install awsebcli
          cd cham_ling_app_BE/cham_ling
          eb deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Шаг 6: Мониторинг и логи

```bash
# Просмотр логов Elastic Beanstalk
eb logs

# Просмотр CloudFront логов
aws cloudfront list-distributions
```

## Стоимость (примерная)

- S3: ~$0.023/GB в месяц
- CloudFront: ~$0.085/GB (первые 10TB)
- Elastic Beanstalk (t3.small): ~$15/месяц
- RDS (db.t3.micro): ~$15/месяц

**Итого**: ~$30-40/месяц для малого трафика

## Безопасность

1. Используйте IAM роли вместо хранения ключей
2. Настройте Security Groups правильно
3. Используйте HTTPS везде
4. Регулярно обновляйте зависимости
5. Используйте AWS Secrets Manager для секретов

## Поддержка

При возникновении проблем проверьте:
- CloudWatch Logs для логов
- Elastic Beanstalk Health Dashboard
- S3 Bucket policies
- RDS connection settings

