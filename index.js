const express = require('express');
const cors = require('cors'); // إضافة حزمة كورس
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors()); // تفعيل كورس للسماح بالاتصال من أي موقع
app.use(express.json());

// قواعد البيانات المؤقتة في الذاكرة (Memory)
let users = [];        // أقصى حد 5 حسابات
let messages = [];     // الرسائل الخاصة

// 1. تسجيل حساب جديد (اليوزر وكلمة المرور فقط، بحد أقصى 5 حسابات)
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "الرجاء كتابة اليوزرنيم وكلمة المرور!" });
  }

  // التحقق من عدد الحسابات (أقصى حد 5)
  if (users.length >= 5) {
    return res.status(400).json({ error: "عذراً، المنصة ممتلئة (الحد الأقصى 5 حسابات فقط)!" });
  }

  // التأكد إن اليوزرنيم مش مكرر
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: "اسم المستخدم مأخوذ، اختر غيره!" });
  }

  const newUser = { username, password };
  users.push(newUser);

  res.status(201).json({ message: "تم إنشاء الحساب بنجاح!", user: username });
});

// 2. تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ error: "خطأ في اسم المستخدم أو كلمة المرور!" });
  }

  res.json({ message: "تم تسجيل الدخول بنجاح!", username });
});

// 3. إرسال رسالة لشخص تاني باليوزرنيم بتاعو
app.post('/send', (req, res) => {
  const { sender, receiver, text } = req.body;

  if (!sender || !receiver || !text) {
    return res.status(400).json({ error: "بيانات الرسالة غير مكتملة!" });
  }

  // التأكد إن المستقبل مسجل في المنصة
  const receiverExists = users.some(u => u.username === receiver);
  if (!receiverExists) {
    return res.status(404).json({ error: "المستخدم غير موجود!" });
  }

  const newMessage = {
    id: messages.length + 1,
    sender,
    receiver,
    text,
    timestamp: Date.now()
  };

  messages.push(newMessage);
  res.status(201).json({ message: "تم إرسال الرسالة", data: newMessage });
});

// 4. جلب الرسائل بينك وبين شخص معين
app.get('/messages', (req, res) => {
  const { user1, user2 } = req.query;

  const chatMessages = messages.filter(m => 
    (m.sender === user1 && m.receiver === user2) || 
    (m.sender === user2 && m.receiver === user1)
  );

  res.json(chatMessages);
});

// 5. ميزة الحذف التلقائي: مسح الرسائل الأقدم من ساعة (كل 10 دقائق يفحص السيرفر)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const beforeCount = messages.length;
  messages = messages.filter(m => m.timestamp > oneHourAgo);
  if (messages.length < beforeCount) {
    console.log("تم تنظيف الرسائل القديمة (أكبر من ساعة).");
  }
}, 10 * 60 * 1000);

app.get('/', (req, res) => {
  res.json({ status: "running", activeUsers: users.length });
});

app.listen(PORT, () => {
  console.log(`Chat Server is running on port ${PORT}`);
});
