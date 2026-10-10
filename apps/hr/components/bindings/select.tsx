'use client';
import {Select as SharedSelect,type SelectProps} from '@orgtik/ui';
import type {ReactNode,ReactElement} from 'react';
import {elements} from './children';
export function Select({children,value,defaultValue,onValueChange,...props}:Omit<SelectProps,'options'|'value'|'defaultValue'|'onValueChange'>&{children:ReactNode;value?:string|number|null;defaultValue?:string|number|null;onValueChange?:(value:string|null)=>void}){
  const all=elements(children),trigger=all.find(e=>e.type===SelectTrigger),placeholder=all.find(e=>e.type===SelectValue)?.props.placeholder as ReactNode;
  const option=(element:ReactElement<Record<string,unknown>>)=>({value:String(element.props.value),label:element.props.children as ReactNode,disabled:Boolean(element.props.disabled)});
  const groups=all.filter(e=>e.type===SelectGroup),groupedValues=new Set(groups.flatMap(group=>elements(group.props.children as ReactNode).filter(e=>e.type===SelectItem).map(e=>String(e.props.value))));
  const options=all.flatMap<SelectProps["options"][number]>(element=>element.type===SelectGroup?[{label:elements(element.props.children as ReactNode).find(e=>e.type===SelectLabel)?.props.children as ReactNode,options:elements(element.props.children as ReactNode).filter(e=>e.type===SelectItem).map(option)}]:element.type===SelectItem&&!groupedValues.has(String(element.props.value))?[option(element)]:[]);
  return <SharedSelect {...props} value={value==null?value:String(value)} defaultValue={defaultValue==null?defaultValue:String(defaultValue)} onValueChange={onValueChange} className={trigger?.props.className as string||props.className} id={trigger?.props.id as string||props.id} disabled={props.disabled||Boolean(trigger?.props.disabled)} aria-label={trigger?.props['aria-label'] as string||props['aria-label']} placeholder={placeholder} options={options}/>;
}
export const SelectTrigger=({children}:{children?:ReactNode;className?:string;size?:string;disabled?:boolean;'aria-label'?:string;id?:string})=><>{children}</>;
export const SelectValue=({children}:{children?:ReactNode;placeholder?:ReactNode})=><>{children}</>;
export const SelectContent=({children}:{children?:ReactNode;className?:string;side?:string;align?:string;alignItemWithTrigger?:boolean})=><>{children}</>;
export const SelectItem=({children}:{children?:ReactNode;value:string|number;disabled?:boolean;className?:string})=><>{children}</>;
export const SelectGroup=({children}:{children?:ReactNode})=><>{children}</>;
export const SelectLabel=({children}:{children?:ReactNode})=><>{children}</>;
