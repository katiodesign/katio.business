"use client";
import {useId,useRef,useState} from "react";
import {ChevronDown} from "lucide-react";
import styles from "./category-input.module.css";

export default function CategoryInput({categories,defaultValue,placeholder}:{categories:string[];defaultValue?:string;placeholder?:string}){
 const id=useId(),input=useRef<HTMLInputElement>(null);
 const [value,setValue]=useState(defaultValue||""),[open,setOpen]=useState(false),[active,setActive]=useState(-1),[showAll,setShowAll]=useState(false);
 const options=showAll?categories:categories.filter(category=>category.toLocaleLowerCase("es-CO").includes(value.toLocaleLowerCase("es-CO")));
 function choose(category:string){setValue(category);setOpen(false);setActive(-1);input.current?.focus()}
 return <span className={styles.field} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
  <input ref={input} name="category" value={value} placeholder={placeholder} maxLength={100} required autoComplete="off" role="combobox" aria-expanded={open&&options.length>0} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open&&active>=0?`${id}-${active}`:undefined} onChange={event=>{setValue(event.target.value);setShowAll(false);setOpen(true);setActive(-1)}} onKeyDown={event=>{if(event.key==="Escape"){setOpen(false);setActive(-1)}else if(event.key==="ArrowDown"&&options.length){event.preventDefault();setOpen(true);setActive(index=>Math.min(index+1,options.length-1))}else if(event.key==="ArrowUp"&&options.length){event.preventDefault();setOpen(true);setActive(index=>Math.max(index-1,0))}else if(event.key==="Enter"&&open&&active>=0&&options[active]){event.preventDefault();choose(options[active])}}}/>
  <button type="button" aria-label="Mostrar categorías" aria-expanded={open&&options.length>0} aria-controls={id} onClick={()=>{setShowAll(true);setOpen(current=>!current);setActive(-1);input.current?.focus()}}><ChevronDown size={16} aria-hidden="true"/></button>
  {open&&options.length>0&&<span className={styles.options} id={id} role="listbox">{options.map((category,index)=><span role="option" id={`${id}-${index}`} aria-selected={active===index} key={category} className={styles.option} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(category)}>{category}</span>)}</span>}
 </span>;
}
