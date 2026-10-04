import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, Sword } from 'lucide-react';
import { supabase, type WeaponMaster } from '@/lib/supabase';

const btn='inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm';

function requirementText(weapon: WeaponMaster) {
  const parts:string[]=[];
  if (weapon.requirement_attribute && weapon.requirement_attribute_min > 0) parts.push(`${weapon.requirement_attribute} ${weapon.requirement_attribute_min}`);
  if (weapon.requirement_skill && weapon.requirement_skill_min > 0) parts.push(`${weapon.requirement_skill} ${weapon.requirement_skill_min}`);
  return parts.join(' + ') || '—';
}

export default function WeaponCatalogAdmin({playerId}:{playerId:string}){
  const [weapons,setWeapons]=useState<WeaponMaster[]>([]);
  const [loading,setLoading]=useState(true);

  const load=async()=>{
    setLoading(true);
    const {data,error}=await supabase.rpc('get_master_weapon_catalog',{p_player_id:playerId});
    if(error){console.error(error);setWeapons([])}else setWeapons((data||[]) as WeaponMaster[]);
    setLoading(false);
  };

  useEffect(()=>{load()},[playerId]);

  const groups=useMemo(()=>{
    const ordered:string[]=[];
    const map=new Map<string,WeaponMaster[]>();
    for(const weapon of weapons){
      if(!map.has(weapon.family)){map.set(weapon.family,[]);ordered.push(weapon.family)}
      map.get(weapon.family)!.push(weapon);
    }
    return ordered.map(name=>({name,weapons:map.get(name)!}));
  },[weapons]);

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2"><Sword className="w-5 h-5 text-gold"/><h2 className="font-display text-xl text-gold-bright">Catálogo de Armas</h2></div>
        <p className="text-xs text-parchment-dim mt-1">Dados mecânicos reservados ao Mestre. A ficha do jogador recebe apenas o estado de proficiência.</p>
      </div>
      <button className={btn} onClick={load}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Atualizar</button>
    </div>

    <div className="rounded-xl border border-gold-dim bg-shadow/40 p-4 text-sm text-parchment-dim">
      <div className="flex items-center gap-2 text-gold-bright"><ShieldCheck className="w-4 h-4"/><b>Regra de manejo</b></div>
      <p className="mt-2">Para cada ponto abaixo do Atributo ou Habilidade exigidos, o Dano Base cai em 1. Valores acima do requisito não aumentam o dano. Bônus raciais e de linhagem contam para o manejo.</p>
      <p className="mt-2 text-gold">Dano Efetivo → + Sucessos Excedentes → − Absorção da armadura.</p>
    </div>

    {loading?<p className="text-parchment-dim">Carregando catálogo...</p>:weapons.length===0?<div className="rounded-xl border border-gold-dim bg-gradient-card p-5 text-parchment-dim">Nenhuma arma encontrada. Execute a migration do catálogo de armas no Supabase.</div>:groups.map(group=><div key={group.name} className="overflow-hidden rounded-xl border border-gold-dim bg-gradient-card">
      <div className="border-b border-gold-dim bg-shadow/45 px-4 py-3"><h3 className="font-display text-lg text-gold-bright">{group.name}</h3><p className="text-xs text-parchment-dim">{group.weapons.length} arma(s)</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-xs">
          <thead className="text-left text-gold bg-shadow/30"><tr><th className="p-3">Arma</th><th className="p-3">Dano</th><th className="p-3">Tipo</th><th className="p-3">Ataque</th><th className="p-3">Requisito</th><th className="p-3">Mãos</th><th className="p-3">Alcance</th><th className="p-3">Regra / observação</th></tr></thead>
          <tbody>{group.weapons.map(weapon=><tr key={weapon.id} className="border-t border-gold-dim/40 align-top"><td className="p-3 font-display text-sm text-gold-bright">{weapon.name}</td><td className="p-3 font-display text-gold">{weapon.damage_base}</td><td className="p-3 text-parchment-dim">{weapon.damage_type}</td><td className="p-3 text-parchment">{weapon.attack_attribute} + {weapon.attack_skill}</td><td className="p-3 text-parchment">{requirementText(weapon)}</td><td className="p-3 text-parchment-dim">{weapon.hands}</td><td className="p-3 text-parchment-dim">{weapon.range_label}</td><td className="p-3 text-parchment-dim max-w-sm">{weapon.special_rule||'—'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>)}
  </section>;
}
