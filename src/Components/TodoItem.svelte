<script>
    export let nameTodo;
    export let idx;
    export let handlerDelete;
    export let handlerFinish;

    const handlerClick = () => {
        handlerDelete(idx);
    };

    const handlerClickFinish = () => {
        handlerFinish(idx);
    };
</script>

<div class="wrapper-todo-block-{idx} wrapper-todo-block flex flex-row flex-align-baseline">
    <button on:click={handlerClickFinish} class="{idx}">Finsh</button>
    <p>{nameTodo}</p>
    <button class="{idx}" on:click={handlerClick}>delete</button>
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
