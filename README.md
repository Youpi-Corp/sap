application/:

    Contains the application services that coordinate the domain logic. This is where use cases live.
    Services here are responsible for handling business rules, delegating work to domain entities, and calling the appropriate adapters.
    This layer doesn't deal with external concerns like how data is persisted.

domain/:

    The core domain models live here. These models are business entities (e.g, User, Order) and contain the core logic related to these entities.
    Repositories are defined as traits here, representing the interfaces to the persistence layer. This helps to abstract how data is stored (the database or storage mechanism is an implementation detail).
    Entities should not contain any database-specific logic.

infrastructure/:

    The infrastructure layer contains adapters for external systems (e.g., the database or external APIs).
    For example, persistence/user_repository.rs would contain the implementation of the user repository trait using Diesel for PostgreSQL.
    This is where the database interaction (Diesel) is implemented, but the rest of your application doesn't depend on these specifics.

A swagger-ui is available at:
https://brainforest-ozct.shuttle.app/swagger-ui/
