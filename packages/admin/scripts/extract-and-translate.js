#!/usr/bin/env node

/**
 * Script to extract translations and provide basic Russian translations
 * Run with: node scripts/extract-and-translate.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Basic Russian translations for common UI terms
const commonTranslations = {
  // Navigation & Actions
  "Create": "Создать",
  "Edit": "Редактировать", 
  "Delete": "Удалить",
  "Save": "Сохранить",
  "Cancel": "Отмена",
  "Submit": "Отправить",
  "Back": "Назад",
  "Next": "Далее",
  "Previous": "Предыдущий",
  "Search": "Поиск",
  "Filter": "Фильтр",
  "Sort": "Сортировка",
  "View": "Просмотр",
  "Details": "Детали",
  "Add": "Добавить",
  "Remove": "Удалить",
  "Update": "Обновить",
  "Refresh": "Обновить",
  "Loading": "Загрузка",
  "Close": "Закрыть",
  "Open": "Открыть",
  "Select": "Выбрать",
  "Clear": "Очистить",
  "Reset": "Сбросить",
  "Apply": "Применить",
  "Export": "Экспорт",
  "Import": "Импорт",
  "Download": "Скачать",
  "Upload": "Загрузить",
  "Print": "Печать",
  "Copy": "Копировать",
  "Cut": "Вырезать",
  "Paste": "Вставить",

  // Status & States
  "Active": "Активный",
  "Inactive": "Неактивный",
  "Enabled": "Включен",
  "Disabled": "Отключен",
  "Published": "Опубликован",
  "Draft": "Черновик",
  "Pending": "В ожидании",
  "Approved": "Одобрено",
  "Rejected": "Отклонено",
  "Cancelled": "Отменено",
  "In Progress": "В процессе",
  "Completed": "Завершено",
  "Failed": "Неудачно",
  "Success": "Успешно",
  "Error": "Ошибка",
  "Warning": "Предупреждение",
  "Info": "Информация",

  // Common Fields
  "Name": "Название",
  "Title": "Заголовок",
  "Description": "Описание",
  "Email": "Email",
  "Password": "Пароль",
  "Username": "Имя пользователя",
  "First Name": "Имя",
  "Last Name": "Фамилия",
  "Phone": "Телефон",
  "Address": "Адрес",
  "Date": "Дата",
  "Time": "Время",
  "Created": "Создано",
  "Updated": "Обновлено",
  "Modified": "Изменено",
  "Created At": "Дата создания",
  "Updated At": "Дата обновления",
  "Created By": "Создал",
  "Updated By": "Обновил",

  // Workflow specific
  "Workflow": "Рабочий процесс",
  "Template": "Шаблон",
  "Request": "Запрос",
  "Approval": "Утверждение",
  "Step": "Шаг",
  "Role": "Роль",
  "User": "Пользователь",
  "Users": "Пользователи",
  "Roles": "Роли",
  "Permissions": "Разрешения",
  "Organization": "Организация",
  "Department": "Отдел",
  "Manager": "Менеджер",
  "Employee": "Сотрудник",
  "Admin": "Администратор",

  // Messages
  "Please wait": "Пожалуйста, подождите",
  "Loading...": "Загрузка...",
  "No data": "Нет данных",
  "No results": "Нет результатов",
  "Not found": "Не найдено",
  "Access denied": "Доступ запрещен",
  "Something went wrong": "Что-то пошло не так",
  "Operation successful": "Операция выполнена успешно",
  "Operation failed": "Операция не удалась",
  "Are you sure?": "Вы уверены?",
  "This action cannot be undone": "Это действие нельзя отменить",

  // Pagination
  "Page": "Страница",
  "of": "из",
  "items": "элементов",
  "Show": "Показать",
  "per page": "на странице",
  "First": "Первая",
  "Last": "Последняя",

  // Languages
  "Language": "Язык",
  "Change Language": "Изменить язык",
  "Select Language": "Выберите язык",
  "Russian": "Русский",
  "English": "Английский",
};

console.log('🔍 Extracting translations...');

try {
  // Extract messages
  execSync('pnpm extract:text', { stdio: 'inherit' });
  
  console.log('✅ Extraction completed');
  console.log('📝 Adding Russian translations...');
  
  // Read the Russian PO file
  const ruPoPath = path.join(process.cwd(), 'locales/ru/messages.po');
  let content = fs.readFileSync(ruPoPath, 'utf-8');
  
  // Auto-translate common terms
  Object.entries(commonTranslations).forEach(([english, russian]) => {
    // Look for exact matches in msgid
    const regex = new RegExp(`(msgid "${english}"\\s*\\n)msgstr ""`, 'g');
    content = content.replace(regex, `$1msgstr "${russian}"`);
  });
  
  // Write back the updated content
  fs.writeFileSync(ruPoPath, content);
  
  console.log('✅ Russian translations added');
  console.log('🔧 Compiling translations...');
  
  // Compile messages
  execSync('pnpm compile:text', { stdio: 'inherit' });
  
  console.log('✅ All done!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Review locales/ru/messages.po for any missing translations');
  console.log('2. Add more specific translations for your domain');
  console.log('3. Test the application with different languages');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 