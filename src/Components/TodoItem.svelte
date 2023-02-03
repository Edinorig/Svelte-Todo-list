<script>
    export let nameTodo;
    export let idx;
    export let handlerDelete;
    export let handlerFinish;

    const handlerClick = () => {
        console.log(idx);
        handlerDelete(idx);
    };

    const handlerClickFinish = () => {
        console.log(idx);
        handlerFinish(idx);
    };
</script>

<div class="wrapper-todo-block-{idx} wrapper-todo-block flex flex-row flex-align-baseline">
    <button on:click={handlerClickFinish} class="{idx}">Finish</button>
    <p>{nameTodo}</p>
    <button class="{idx}" on:click={handlerClick} >delete</button>
</div>

<style>
    .wrapper-todo-block {
        border-radius: 10px;
        border: 2px solid black;

        padding: 5px;
        margin: 10px;
    }

    button{
        margin: 5px;
    }
</style>
