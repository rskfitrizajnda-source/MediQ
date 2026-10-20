const prisma = require('../src/lib/prisma');

async function main() {
  console.log('Memeriksa email pengguna di database...');

  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@mediq.com',
      },
    },
  });

  if (users.length === 0) {
    console.log('Tidak ada akun dengan akhiran @mediq.com yang ditemukan.');
    return;
  }

  console.log(`Ditemukan ${users.length} pengguna dengan email @mediq.com:`);

  for (const user of users) {
    const newEmail = user.email.replace(/@mediq\.com$/i, '@gmail.com');
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });
    console.log(`✓ ${user.email} -> ${newEmail}`);
  }

  console.log('Pembaruan email ke @gmail.com selesai!');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

