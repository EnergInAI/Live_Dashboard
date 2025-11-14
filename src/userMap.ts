// src/userMap.ts
// Active trial device whitelist with name + token
// Remove or change token to instantly expire a link

const userMap: {
  [key: string]: { name: string; token: string };
} = {

  // 12-pin solar - Single Phase

  ENSN001: { name: 'Jyoti Singh', token: '1' },
  ENSN002: { name: 'Testing', token: '1' },
  ENTN001: { name: 'Testing', token: '1' },

  // 6-pin non-solar - Single Phase

  ENSA001: { name: 'To Your Dashboard', token: 'xy' },
  ENSA002: { name: 'To Your Dashboard', token: 'xy' },
  ENSA003: { name: 'To Your Dashboard', token: 'xy' },

    // 6-pin non-solar - Triple Phase

  ENTA001: { name: '—', token: '1' },
  ENTA002: { name: '—', token: '1' },

};

export default userMap;
