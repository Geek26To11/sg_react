import React, { useState, useRef} from "react";
import { render } from "react-dom";
import "./styles.css";

const list = [
    {id: 12984, label: "Hello World", color: "#f5593d"},
    {id: 12983, label: "Hello World", color: "#f5593d"},
    {id: 12985, label: "Hello World", color: "#f5593d"},
    {id: 12986, label: "Hello World", color: "#f5593d"},
    {id: 12987, label: "Hello World", color: "#f5593d"},
    {id: 12988, label: "Hello World", color: "#f5593d"}
];

type ListType = typeof list;

interface DnDElement {
    item: ListType[number];
    dom: HTMLElement;
    position: {x: number; y: number};
}

interface RefType {
    current: DnDElement | null;
    elements: DnDElement[];
    clickPosition: {x: number; y:number};
}

const useDnD = (items: ListType, update: (list: ListType) => void) => {
    const ref = useRef<RefType>({
        current: null,
        elements: [],
        clickPosition: {x: 0, y: 0}
    }).current;

    return {
        items,

        createProps: (id: number) => {
            let canUpdate = true;

            const onMouseMove = (e: MouseEvent) => {
                if(ref.current) {
                    const move_x = e.pageX - ref.clickPosition.x;
                    const move_y = e.pageY - ref.clickPosition.y;
                    const dom = ref.current.dom;
                    
                    dom.style.transform = `translate(${move_x}px,${move_y}px)`;
                    dom.style.transition = "";
                    dom.style.position = "relative";
                    dom.style.zIndex = "999999";

                    if (canUpdate && checkOver(ref, {x: e.pageX, y: e.pageY})) {
                        canUpdate = false;

                        const {left: x, top: y} = ref.current.dom.getBoundingClientRect();

                        ref.current.position = {x, y};
                        ref.clickPosition = {x: e.pageX, y: e.pageY};

                        update(ref.elements.map(v => v.item));

                        setTimeout(() => {
                            canUpdate = true;
                        }, 500);
                    }
                }
            };

            const onMouseUp = () => {
                if (ref.current) {
                    const dom = ref.current.dom;

                    dom.style.transform = "";
                    dom.style.position = "";
                    dom.style.zIndex = "";

                    ref.current = null;
                }

                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            };

            return {
                ref: (dom: HTMLElement | null) => {
                    const item = items.find(v => v.id === id);

                    if(!dom || item) return;

                    dom.style.transform = "";

                    const { left: x, top: y } = dom.getBoundingClientRect();

                    const current = ref.current;

                    if (current) {
                        if (current.item.id === item.id) {
                            const cx = current.position.x - x;
                            const cy = current.position.y - y;

                            dom.style.transform = `translate(${cx}px,${cy}px)`;

                            ref.clickPosition.x -= cx;
                            ref.clickPosition.y -= cy;
                        } else {
                            const ele = ref.elements.find(v => v.item.id === id);

                            if (ele) {
                                animation(dom, ele.position, {x, y});
                            }
                        }
                    }

                    const index = ref.elements.findIndex(v => v.item.id === item.id);

                    if (index !== -1) {
                        ref.elements[index] = { item, dom, position: { x, y } };
                    } else {
                        ref.elements.push({ item, dom, position: {x, y} });
                    }
                },

                onMouseDown: (e: React.MouseEvent) => {
                    const ele = ref.elements.find(v => v.item.id === id);

                    if (ele) {
                        ref.current = ele;
                        ref.clickPosition = { x: e.pageX, y: e.pageY };

                        ref.elements.forEach(v => {
                            const { left: x, top: y } = v.dom.getBoundingClientRect();
                            v.position = {x, y};
                        });

                        window.addEventListener("mousemove", onMouseMove);
                        window.addEventListener("mouseup", onMouseUp);
                    }
                }
            };
        }
    };
};

const checkOver = (ref: RefType, mouse: { x: number; y: number}): boolean => {
    const { current, elements } ref;

    if (!current) return false;

    for (const i in elements) {
        const element = elements[i];
        const currentIndex = elements.findIndex(v => v.item.id === current.item.id);

        if (element.item.id !== current.item.id && element.dom) {
            const rect = element.dom.getBoundingClientRect();

            if (
                mouse.y < rect.bottom &&
                mouse.y > rect.top &&
                mouse.x < rect.right &&
                mouse.x > rect.left
            ) {
                elements.splice(currentIndex, 1);
                elements.splice(+i, 0, current);

                return true;
            }
        }
    }

    return false;
};

const animation = (
    dom: HTMLElement,
    beforePos: { x: number; y: number },
    afterPos: { x: number; y: number}
) => {
    const x = beforePos.x - afterPos.x;
    const y = beforePos.y - afterPos.y;
    
    dom.style.transition = "";
    dom.style.transform = `translate(${x}px, ${y}px)`;

    requestAnimationFrame(() => {
        dom.style.transform = "";
        dom.style.transition = "all 300ms";
    });
};

const App: React.FC = () => {
    const [state, setState] = useState<ListType>(list);
    const { items, createProps } = useDnD(state, setState);

    return (
        <div className="App">
            <ul className="item-body">
                {items.map(v => (
                    <li 
                        className="item"
                        key={`list-item-${v.id}`}
                        style={{ background: v.color }}
                        {...createProps(v.id)}
                    >
                        {v.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const rootElement = document.getElementById("root");
render(<App />, rootElement);