import { Store } from "pullstate";

const queue = new Store({ next: null, wait: null });

export default queue;
