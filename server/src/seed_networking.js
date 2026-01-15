const mongoose = require('mongoose');
const User = require('./models/User');
const Community = require('./models/Community');
require('dotenv').config({ path: 'server/.env' });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a demo admin/user if not exists
    let admin = await User.findOne({ email: 'admin@shram.com' });
    if (!admin) {
        admin = await User.create({
            email: 'admin@shram.com',
            password: 'password123',
            phone: '1234567890',
            stakeholderType: 'individual',
            role: 'admin',
            individual: { fullName: 'Rohit Sharma', roleType: 'employee', designation: 'NGO Program Manager' }
        });
    }

    // Create some suggested users
    const users = [
      {
        email: 'ananya@startup.com',
        password: 'password123',
        phone: '1234567891',
        stakeholderType: 'individual',
        individual: { fullName: 'Ananya Deshpande', roleType: 'employee', designation: 'Social Startup Founder' }
      },
      {
        email: 'vikram@consult.com',
        password: 'password123',
        phone: '1234567892',
        stakeholderType: 'individual',
        individual: { fullName: 'Vikram Kulkarni', roleType: 'employee', designation: 'CSR & Impact Consultant' }
      }
    ];

    for (const u of users) {
      if (!(await User.findOne({ email: u.email }))) {
        await User.create(u);
      }
    }

    // Create some communities
    const communities = [
      {
        name: 'Clean Water Action Group',
        description: 'A collaborative space for NGOs, engineers, and volunteers working on clean water initiatives.',
        sdg: '6',
        creator: admin._id,
        members: [admin._id],
        memberCount: 214 // Seeded number
      },
      {
        name: 'Education for All Network',
        description: 'Educators, institutions, and volunteers collaborating to improve access to quality education.',
        sdg: '4',
        creator: admin._id,
        members: [admin._id],
        memberCount: 178
      }
    ];

    for (const c of communities) {
      if (!(await Community.findOne({ name: c.name }))) {
        await Community.create(c);
      }
    }

    console.log('Seed data created successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
