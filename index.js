const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// ── CONFIG ──
const TOKEN   = process.env.BOT_TOKEN;      // set in .env
const APP_ID  = process.env.APP_ID;         // your Discord Application ID
const GUILD_ID = process.env.GUILD_ID;      // your server ID (for instant slash command updates)

// ── LOAD BANK ──
const bankRaw = JSON.parse(fs.readFileSync('./bank.json', 'utf8'));
const BANK = bankRaw.bank;

// ── HELPERS ──
const PER_PAGE = 15;

function formatName(itemId) {
  const name = itemId.split(':')[1];
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getNs(itemId) { return itemId.split(':')[0]; }

function getImgUrl(itemId) {
  const [ns, name] = itemId.split(':');
  if (ns === 'minecraft') return `https://mc.nbs.gg/items/minecraft/${name}.png`;
  if (ns === 'cobblemon') return `https://mc.nbs.gg/items/cobblemon/${name}.png`;
  return null;
}

function nsBadge(ns) {
  if (ns === 'cobblemon') return '🔴 Cobblemon';
  if (ns === 'lumymon')   return '🌙 Lumymon';
  return '⛏ Minecraft';
}

function searchItems(query) {
  const q = query.toLowerCase().trim();
  return BANK.filter(item =>
    item.item.toLowerCase().includes(q) ||
    formatName(item.item).toLowerCase().includes(q)
  );
}

function buildListEmbed(items, page, query, totalItems) {
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safePage   = Math.max(1, Math.min(page, totalPages));
  const slice      = items.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const rows = slice.map((item, i) => {
    const idx  = (safePage - 1) * PER_PAGE + i + 1;
    const name = formatName(item.item);
    const price = item.price.toLocaleString();
    return `\`${String(idx).padStart(3, ' ')}\` **${name}** — \`${price} ₽\``;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xC8941A)
    .setTitle('🏪  Village Shop — Price List')
    .setDescription(rows || '*No items found.*')
    .setFooter({ text: `Page ${safePage}/${totalPages}  •  ${items.length} result(s)${query ? `  •  Search: "${query}"` : ''}` })
    .setTimestamp();

  return { embed, safePage, totalPages };
}

function buildButtons(page, totalPages, query) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev_${page}_${encodeURIComponent(query)}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`shop_next_${page}_${encodeURIComponent(query)}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
    new ButtonBuilder()
      .setCustomId(`shop_first_${page}_${encodeURIComponent(query)}`)
      .setLabel('⏮ First')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`shop_last_${page}_${encodeURIComponent(query)}`)
      .setLabel('Last ⏭')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
  return row;
}

// ── REGISTER SLASH COMMANDS ──
const commands = [
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the full price list')
    .addIntegerOption(opt => opt.setName('page').setDescription('Page number').setMinValue(1)),

  new SlashCommandBuilder()
    .setName('price')
    .setDescription('Look up the price of a specific item')
    .addStringOption(opt => opt.setName('item').setDescription('Item name or ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search items by name')
    .addStringOption(opt => opt.setName('query').setDescription('What to search for').setRequired(true))
    .addIntegerOption(opt => opt.setName('page').setDescription('Page number').setMinValue(1)),
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(APP_ID, GUILD_ID),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log('✅ Slash commands registered!');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// ── CLIENT ──
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async interaction => {
  // ── SLASH COMMANDS ──
  if (interaction.isChatInputCommand()) {

    // /shop
    if (interaction.commandName === 'shop') {
      const page = interaction.options.getInteger('page') || 1;
      const { embed, safePage, totalPages } = buildListEmbed(BANK, page, '', BANK.length);
      const row = buildButtons(safePage, totalPages, '');
      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // /price
    else if (interaction.commandName === 'price') {
      const query = interaction.options.getString('item');
      const results = searchItems(query);

      if (results.length === 0) {
        return interaction.reply({ content: `❌ No item found matching **${query}**.`, ephemeral: true });
      }

      if (results.length === 1 || results[0].item.toLowerCase().includes(query.toLowerCase().replace(/ /g,'_'))) {
        const item = results[0];
        const ns   = getNs(item.item);
        const img  = getImgUrl(item.item);

        const embed = new EmbedBuilder()
          .setColor(0xC8941A)
          .setTitle(`${formatName(item.item)}`)
          .addFields(
            { name: '💰 Price',    value: `\`${item.price.toLocaleString()} ₽\``, inline: true },
            { name: '📦 Source',   value: nsBadge(ns),                            inline: true },
            { name: '🔑 Item ID',  value: `\`${item.item}\``,                     inline: false }
          )
          .setTimestamp();

        if (img) embed.setThumbnail(img);
        return interaction.reply({ embeds: [embed] });
      }

      // Multiple results — show list
      const { embed, safePage, totalPages } = buildListEmbed(results, 1, query, results.length);
      const row = buildButtons(safePage, totalPages, query);
      await interaction.reply({ embeds: [embed], components: [row] });
    }

    // /search
    else if (interaction.commandName === 'search') {
      const query = interaction.options.getString('query');
      const page  = interaction.options.getInteger('page') || 1;
      const results = searchItems(query);

      if (results.length === 0) {
        return interaction.reply({ content: `❌ No results for **${query}**.`, ephemeral: true });
      }

      const { embed, safePage, totalPages } = buildListEmbed(results, page, query, results.length);
      const row = buildButtons(safePage, totalPages, query);
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // ── BUTTON PAGINATION ──
  if (interaction.isButton()) {
    const [, action, currentPageStr, encodedQuery] = interaction.customId.split('_');
    const query   = decodeURIComponent(encodedQuery || '');
    const items   = query ? searchItems(query) : BANK;
    const curPage = parseInt(currentPageStr);
    const total   = Math.max(1, Math.ceil(items.length / PER_PAGE));

    let newPage = curPage;
    if (action === 'prev')  newPage = curPage - 1;
    if (action === 'next')  newPage = curPage + 1;
    if (action === 'first') newPage = 1;
    if (action === 'last')  newPage = total;

    const { embed, safePage, totalPages } = buildListEmbed(items, newPage, query, items.length);
    const row = buildButtons(safePage, totalPages, query);
    await interaction.update({ embeds: [embed], components: [row] });
  }
});

client.login(TOKEN);
