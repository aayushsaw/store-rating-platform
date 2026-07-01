import { PrismaClient, Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// Shuffles an array in place
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const indianAdmins = [
  { name: 'Aayush Saw', email: 'aayush.admin@example.com' },
  { name: 'Priya Shah', email: 'priya.admin@example.com' },
  { name: 'Rahul Patil', email: 'rahul.admin@example.com' },
];

const indianOwners = [
  {
    name: 'Vikram Malhotra',
    email: 'vikram.owner@example.com',
    storeName: 'Malhotra Spices & Sweets',
  },
  { name: 'Ananya Sen', email: 'ananya.owner@example.com', storeName: 'Kolkata Kathi Rolls' },
  { name: 'Rohan Joshi', email: 'rohan.owner@example.com', storeName: 'Pune Bakers & Cafe' },
  { name: 'Karan Mehra', email: 'karan.owner@example.com', storeName: 'Delhi Durbar Restaurant' },
  { name: 'Meera Nair', email: 'meera.owner@example.com', storeName: 'Nair South Indian Cafe' },
  { name: 'Amit Sharma', email: 'amit.owner@example.com', storeName: 'Sharma Tea Stall' },
  { name: 'Aditi Rao', email: 'aditi.owner@example.com', storeName: 'Hyderabad Biryani Hub' },
  { name: 'Siddharth Roy', email: 'siddharth.owner@example.com', storeName: 'Roy Fish Market' },
  { name: 'Neha Kapoor', email: 'neha.owner@example.com', storeName: 'Kapoor Garments & Fashion' },
  { name: 'Rajesh Verma', email: 'rajesh.owner@example.com', storeName: 'Verma Sweet House' },
  { name: 'Sneha Gupta', email: 'sneha.owner@example.com', storeName: 'Gupta Stationery & Gifts' },
  { name: 'Sanjay Dutt', email: 'sanjay.owner@example.com', storeName: 'Sanju Dhaba & Restaurant' },
  { name: 'Divya Khosla', email: 'divya.owner@example.com', storeName: 'Divya Beauty Parlour' },
  { name: 'Arjun Rampal', email: 'arjun.owner@example.com', storeName: 'Arjun Fitness Club' },
  { name: 'Kriti Sanon', email: 'kriti.owner@example.com', storeName: 'Sanon Dry Fruits House' },
];

const indianCustomers = [
  { name: 'Aarav Mehta', email: 'aarav.customer@example.com' },
  { name: 'Ishaan Dubey', email: 'ishaan.customer@example.com' },
  { name: 'Vihaan Singhal', email: 'vihaan.customer@example.com' },
  { name: 'Aditya Birla', email: 'aditya.customer@example.com' },
  { name: 'Kabir Kapoor', email: 'kabir.customer@example.com' },
  { name: 'Riya Saxena', email: 'riya.customer@example.com' },
  { name: 'Anika Iyer', email: 'anika.customer@example.com' },
  { name: 'Diya Bhatia', email: 'diya.customer@example.com' },
  { name: 'Saanvi Mahajan', email: 'saanvi.customer@example.com' },
  { name: 'Zara Siddiqui', email: 'zara.customer@example.com' },
  { name: 'Dev Sharma', email: 'dev.customer@example.com' },
  { name: 'Reyansh Goel', email: 'reyansh.customer@example.com' },
  { name: 'Pranav Anand', email: 'pranav.customer@example.com' },
  { name: 'Atharv Trivedi', email: 'atharv.customer@example.com' },
  { name: 'Sai Krishna', email: 'sai.customer@example.com' },
  { name: 'Kiara Advani', email: 'kiara.customer@example.com' },
  { name: 'Shruti Haasan', email: 'shruti.customer@example.com' },
  { name: 'Alia Bhatt', email: 'alia.customer@example.com' },
  { name: 'Varun Dhawan', email: 'varun.customer@example.com' },
  { name: 'Ranbir Kapoor', email: 'ranbir.customer@example.com' },
];

const comments5Star = [
  'Absolutely amazing service! Highly recommended.',
  'Excellent quality, very friendly staff and clean setup.',
  'Best store in town! Extremely satisfied with the experience.',
  'Out of this world! Worth every single rupee.',
  'Great customer support and very quick response times.',
];

const comments4Star = [
  'Great experience, will definitely visit again.',
  'Good service and clean place. Satisfied.',
  'Really liked the collection, highly recommended.',
  'Decent value for money. Helpful staff.',
  'Nice ambiance and good choices available.',
];

const comments3Star = [
  'Average experience, could be improved.',
  'Decent products but service was rather slow.',
  'Okayish place, not too bad but nothing special.',
  'Normal experience. Standard rates.',
  'Staff was polite but collection was limited.',
];

const comments2Star = [
  'Not recommended. Poor quality and slow service.',
  'Disappointed. The experience did not match the price.',
  'Decent place but staff was slightly impolite.',
];

const comments1Star = [
  'Worst experience ever! Terrible service.',
  'Highly disappointed. Rude staff and bad products.',
  'Stay away! Complete waste of money.',
];

async function main() {
  console.log('🔄 Cleaning up database states...');
  await prisma.rating.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  console.log('🔑 Generating password hashes...');
  const passwordHash = bcryptjs.hashSync('Secure@123', 12);
  const commonAddress = '123 Main Street, Sector 62, Noida, UP 201301';

  console.log('👮 Seeding administrators...');
  const admins = [];
  for (const admin of indianAdmins) {
    const created = await prisma.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        passwordHash,
        address: commonAddress,
        role: Role.SYSTEM_ADMIN,
      },
    });
    admins.push(created);
  }

  console.log('💼 Seeding store owners & shops...');
  const owners = [];
  const stores = [];
  for (const item of indianOwners) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        passwordHash,
        address: commonAddress,
        role: Role.STORE_OWNER,
      },
    });
    owners.push(user);

    const store = await prisma.store.create({
      data: {
        name: item.storeName,
        email: `contact@${item.storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        address: `${Math.floor(Math.random() * 500) + 10} Commercial Street, Connaught Place, New Delhi`,
        ownerId: user.id,
      },
    });
    stores.push(store);
  }

  console.log('👤 Seeding customers...');
  const customers = [];
  for (const item of indianCustomers) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        passwordHash,
        address: commonAddress,
        role: Role.NORMAL_USER,
      },
    });
    customers.push(user);
  }

  console.log('⭐ Creating 100 ratings matching requested distribution...');

  // 50% 4-star, 25% 5-star, 15% 3-star, 10% 1-2 star
  const ratingValues: number[] = [];
  for (let i = 0; i < 50; i++) ratingValues.push(4);
  for (let i = 0; i < 25; i++) ratingValues.push(5);
  for (let i = 0; i < 15; i++) ratingValues.push(3);
  for (let i = 0; i < 5; i++) ratingValues.push(2);
  for (let i = 0; i < 5; i++) ratingValues.push(1);

  // Shuffle target ratings
  shuffle(ratingValues);

  // Prepare a pool of raters: customers & admins (owners do not rate stores, or owners rate other stores)
  const ratingUsers = [...customers, ...admins];

  // Helper to get random comment
  const getComment = (value: number): string => {
    let pool = comments3Star;
    if (value === 5) pool = comments5Star;
    else if (value === 4) pool = comments4Star;
    else if (value === 2) pool = comments2Star;
    else if (value === 1) pool = comments1Star;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Generate unique user-store pairs
  const pairs: Set<string> = new Set();
  let ratingCount = 0;

  while (ratingCount < 100) {
    const user = ratingUsers[Math.floor(Math.random() * ratingUsers.length)];
    const store = stores[Math.floor(Math.random() * stores.length)];

    const pairKey = `${user.id}-${store.id}`;
    if (pairs.has(pairKey)) continue; // Ensure no duplicates

    // Store owner cannot rate their own store guard
    if (store.ownerId === user.id) continue;

    pairs.add(pairKey);

    const val = ratingValues[ratingCount];
    const comment = getComment(val);

    // Timestamps within the last 6 months
    const dateOffset = Math.floor(Math.random() * 180);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - dateOffset);

    await prisma.rating.create({
      data: {
        userId: user.id,
        storeId: store.id,
        value: val,
        comment,
        createdAt,
        updatedAt: createdAt,
      },
    });

    ratingCount++;
  }

  console.log(`✅ Database successfully seeded with 100 ratings across ${stores.length} stores.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
