require('dotenv').config();
const { appendRegistration } = require('./sheets');

const teams = [
  {
    teamName: "Voiders",
    college: "SRM Institute of Science and Technology-Ramapuram",
    transactionId: "GARBAGE_TXN_1",
    participants: [
      { name: "Kaviya.V.K", reg: "GARBAGE_REG_1", phone: "9500098266", email: "vkkaviya6126@gmail.com" },
      { name: "Monish.S", reg: "GARBAGE_REG_2", phone: "9884245474", email: "monishsuresh777@gmail.com" },
      { name: "Varsha.S", reg: "GARBAGE_REG_3", phone: "7708782532", email: "vikashinivarsha@gmail.com" }
    ]
  },
  {
    teamName: "Levelopers",
    college: "SRMIST RAMAPURAM",
    transactionId: "GARBAGE_TXN_2",
    participants: [
      { name: "OM AKASH M S", reg: "GARBAGE_REG_1", phone: "8778613204", email: "omakash.ms@gmail.com" },
      { name: "Adivigneshwaran", reg: "GARBAGE_REG_2", phone: "9345930976", email: "adi.vignesh.k@gmail.com" },
      { name: "Swasthika ranganathan", reg: "GARBAGE_REG_3", phone: "7094234999", email: "swasthikkaranganathan@gmail.com" },
      { name: "Rudrapriya", reg: "GARBAGE_REG_4", phone: "9042181754", email: "rudrapriyaravichandran@gmail.com" }
    ]
  },
  {
    teamName: "Syntax Squad",
    college: "Rajalakshmi Institute of Technology",
    transactionId: "GARBAGE_TXN_3",
    participants: [
      { name: "Varshani S V", reg: "GARBAGE_REG_1", phone: "7358744683", email: "varshani.240338@aids.ritchennai.edu.in" },
      { name: "Gokulnath P", reg: "GARBAGE_REG_2", phone: "7904769396", email: "gokulnathp.240037@vlsi.ritchennai.edu.in" },
      { name: "R Surya", reg: "GARBAGE_REG_3", phone: "9677242390", email: "suryar.240320@aids.ritchennai.edu.in" },
      { name: "Janani B", reg: "GARBAGE_REG_4", phone: "8807707304", email: "jananib.240047@csbs.ritchennai.edu.in" }
    ]
  },
  {
    teamName: "Autobots",
    college: "SRM INSTITUTE RAMAPURAM",
    transactionId: "GARBAGE_TXN_4",
    participants: [
      { name: "Thiruselvan P", reg: "GARBAGE_REG_1", phone: "9344813315", email: "offtsp2006@gmail.com" },
      { name: "Mitul G", reg: "GARBAGE_REG_2", phone: "7200389460", email: "mitulgovind9@gmail.com" },
      { name: "Bhuwanenthiran D M", reg: "GARBAGE_REG_3", phone: "9791132297", email: "bhuwanenthirandhanasekaran@gmail.com" },
      { name: "Sri Jai deep s", reg: "GARBAGE_REG_4", phone: "6385369669", email: "kfyttio@gmail.com" }
    ]
  },
  {
    teamName: "Innovators",
    college: "RIT",
    transactionId: "GARBAGE_TXN_5",
    participants: [
      { name: "Shonmitha V M", reg: "GARBAGE_REG_1", phone: "7418700194", email: "shonmitha.240083@cce.ritchennai.edu.in" },
      { name: "Subathra S", reg: "GARBAGE_REG_2", phone: "9043520907", email: "subathra.240087@cce.ritchennai.edu.in" },
      { name: "Suganya", reg: "GARBAGE_REG_3", phone: "9092375297", email: "suganya.240088@cce.ritchennai.edu.in" },
      { name: "Shabeena S", reg: "GARBAGE_REG_4", phone: "8124878809", email: "shabeena.240079@cce.ritchennai.edu.in" }
    ]
  },
  {
    teamName: "The hackaholics",
    college: "RIT",
    transactionId: "GARBAGE_TXN_6",
    participants: [
      { name: "Nivaedhitha", reg: "GARBAGE_REG_1", phone: "6385036061", email: "nivaedhitha.240058@cce.ritchennai.edu.in" },
      { name: "Nivethitha", reg: "GARBAGE_REG_2", phone: "6381909919", email: "nivethitha.240059@cce.ritchennai.edu.in" },
      { name: "V.Prakashini", reg: "GARBAGE_REG_3", phone: "8124510310", email: "prakashini.240064@cce.ritchennai.edu.in" },
      { name: "Niraimathi R", reg: "GARBAGE_REG_4", phone: "9566809429", email: "niraimathi.240057@cce.ritchennai.edu.in" }
    ]
  },
  {
    teamName: "Future Builders",
    college: "Saveetha Engineering College",
    transactionId: "GARBAGE_TXN_7",
    participants: [
      { name: "Ragavan E", reg: "GARBAGE_REG_1", phone: "8778526217", email: "ragavcsesec23@gmail.com" },
      { name: "Kannan S", reg: "GARBAGE_REG_2", phone: "9600160882", email: "kannansathiya2005@gmail.com" },
      { name: "Prashanth K", reg: "GARBAGE_REG_3", phone: "9840524745", email: "prashanth2831@gmail.com" },
      { name: "Jidhesh P", reg: "GARBAGE_REG_4", phone: "6381901430", email: "jidheshprabu@gmail.com" }
    ]
  }
];

async function addTeams() {
  for (const team of teams) {
    try {
      console.log(`Adding team ${team.teamName}...`);
      const result = await appendRegistration(team);
      console.log(`✅ Success! Added team ${team.teamName} to row ${result.rowIndex}`);
    } catch (err) {
      console.error(`❌ Error adding team ${team.teamName}: ${err.message}`);
    }
  }
  console.log("Finished adding all teams.");
}

addTeams();
