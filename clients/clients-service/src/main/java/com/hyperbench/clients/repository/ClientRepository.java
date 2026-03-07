package com.hyperbench.clients.repository;

import com.hyperbench.clients.domain.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

@RepositoryRestResource(path = "clients")
public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByNameContainingIgnoreCase(String name);

    List<Client> findTop10ByOrderByAccountValueDesc();

    List<Client> findTop10ByOrderByLastActivityDateDesc();
}
