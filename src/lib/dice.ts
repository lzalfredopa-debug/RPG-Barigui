export type TestRoll = {
  dice: number[];
  successes: number;
  ones: number;
  netSuccesses: number;
  result: 'Falha Crítica'|'Falha'|'Marginal'|'Moderado'|'Completo'|'Excepcional'|'Fenomenal';
};

export function resultLabel(net:number):TestRoll['result']{
  if(net<=-1)return 'Falha Crítica'; if(net===0)return 'Falha'; if(net===1)return 'Marginal';
  if(net===2)return 'Moderado'; if(net===3)return 'Completo'; if(net===4)return 'Excepcional'; return 'Fenomenal';
}

// Regra oficial TRILHA: cada 10 vale 1 sucesso e gera +1d10. O dado extra
// também pode explodir. Cada 1 cancela um sucesso. Sucesso exige resultado > dificuldade.
export function rollTest(pool:number,difficulty:number,random:()=>number=Math.random):TestRoll{
  const dice:number[]=[]; let pending=Math.max(0,Math.floor(pool)); let successes=0; let ones=0;
  while(pending>0){ pending--; const die=Math.floor(random()*10)+1; dice.push(die); if(die===1){ones++;continue} if(die>difficulty)successes++; if(die===10)pending++; }
  const netSuccesses=successes-ones;
  return {dice,successes,ones,netSuccesses,result:resultLabel(netSuccesses)};
}
