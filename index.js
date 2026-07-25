const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// تخزين الحسابات والرسائل
let users = [];
let messages = [];

// تسجيل حساب جديد
app.post('/register', (req, res) => {
  const { username, password, acceptTerms } = req.body;
  if (!username || !password) return res.status(400).json({ error: "الرجاء ملء الحقول!" });
  if (!acceptTerms) return res.status(400).json({ error: "يجب الموافقة على الشروط!" });
  
  if (users.length >= 5 && username.toLowerCase() !== 'hemo') {
    return res.status(400).json({ error: "عذراً، الحد الأقصى 5 حسابات مسجلة فقط!" });
  }

  const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) return res.status(400).json({ error: "اسم المستخدم مأخوذ مسبقاً!" });

  users.push({ username, password, isBanned: false });
  res.json({ success: true });
});

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (!user) return res.status(400).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة!" });
  if (user.isBanned) return res.status(403).json({ error: "هذا الحساب محظور حالياً!" });

  const isAdmin = (username.toLowerCase() === 'hemo');
  res.json({ success: true, username: user.username, isAdmin, verified: isAdmin });
});

// إرسال رسالة
app.post('/send', (req, res) => {
  const { sender, receiver, text } = req.body;
  if (!sender || !receiver || !text) return res.status(400).json({ error: "بيانات ناقصة" });

  const newMessage = { id: messages.length + 1, sender, receiver, text };
  messages.push(newMessage);
  res.json({ success: true });
});

// جلب الرسائل بين اثنين
app.get('/messages', (req, res) => {
  const { user1, user2 } = req.query;
  const chatMessages = messages.filter(m => 
    (m.sender === user1 && m.receiver === user2) || 
    (m.sender === user2 && m.receiver === user1)
  );
  res.json(chatMessages);
});

// جلب المستخدمين للإدارة
app.get('/admin/users', (req, res) => {
  res.json(users);
});

// حظر مستخدم
app.post('/admin/ban-user', (req, res) => {
  const { targetUser } = req.body;
  const user = users.find(u => u.username === targetUser);
  if (user) {
    user.isBanned = !user.isBanned;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "المستخدم غير موجود" });
  }
});

// حذف مستخدم
app.post('/admin/delete-user', (req, res) => {
  const { targetUser } = req.body;
  users = users.filter(u => u.username !== targetUser);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
                          
